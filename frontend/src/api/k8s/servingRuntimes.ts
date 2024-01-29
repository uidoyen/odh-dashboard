import * as _ from 'lodash';
import {
  k8sCreateResource,
  k8sDeleteResource,
  k8sGetResource,
  k8sListResource,
  k8sUpdateResource,
} from '@openshift/dynamic-plugin-sdk-utils';
import { ServingRuntimeModel } from '~/api/models';
import {
  K8sAPIOptions,
  ServingContainer,
  ServingRuntimeAnnotations,
  ServingRuntimeKind,
} from '~/k8sTypes';
import { CreatingServingRuntimeObject } from '~/pages/modelServing/screens/types';
import { ContainerResources } from '~/types';
import { getModelServingRuntimeName } from '~/pages/modelServing/utils';
import { getDisplayNameFromK8sResource, translateDisplayNameForK8s } from '~/pages/projects/utils';
import { applyK8sAPIOptions } from '~/api/apiMergeUtils';
import { AcceleratorProfileState } from '~/utilities/useAcceleratorProfileState';
import { getModelServingProjects } from './projects';
import { assemblePodSpecOptions, getshmVolume, getshmVolumeMount } from './utils';

export const assembleServingRuntime = (
  data: CreatingServingRuntimeObject,
  namespace: string,
  servingRuntime: ServingRuntimeKind,
  isCustomServingRuntimesEnabled: boolean,
  isEditing?: boolean,
  acceleratorProfileState?: AcceleratorProfileState,
  isModelMesh?: boolean,
): ServingRuntimeKind => {
  const { name: displayName, numReplicas, modelSize, externalRoute, tokenAuth } = data;
  const createName = isCustomServingRuntimesEnabled
    ? translateDisplayNameForK8s(displayName)
    : getModelServingRuntimeName(namespace);
  const updatedServingRuntime = { ...servingRuntime };

  const annotations: ServingRuntimeAnnotations = {
    ...updatedServingRuntime.metadata.annotations,
  };

  if (externalRoute) {
    annotations['enable-route'] = 'true';
  } else {
    delete annotations['enable-route'];
  }
  if (tokenAuth) {
    annotations['enable-auth'] = 'true';
  } else {
    delete annotations['enable-auth'];
  }

  // TODO: Enable GRPC
  if (!isEditing) {
    updatedServingRuntime.metadata = {
      ...updatedServingRuntime.metadata,
      name: createName,
      namespace,
      labels: {
        ...updatedServingRuntime.metadata.labels,
        'opendatahub.io/dashboard': 'true',
      },
      annotations: {
        ...annotations,
        ...(isCustomServingRuntimesEnabled && { 'openshift.io/display-name': displayName.trim() }),
        ...(isCustomServingRuntimesEnabled && {
          'opendatahub.io/template-name': servingRuntime.metadata.name,
        }),
        ...(isCustomServingRuntimesEnabled && {
          'opendatahub.io/template-display-name': getDisplayNameFromK8sResource(servingRuntime),
          'opendatahub.io/accelerator-name':
            acceleratorProfileState?.acceleratorProfile?.metadata.name || '',
        }),
      },
    };
  } else {
    updatedServingRuntime.metadata = {
      ...updatedServingRuntime.metadata,
      annotations: {
        ...annotations,
        'opendatahub.io/accelerator-name':
          acceleratorProfileState?.acceleratorProfile?.metadata.name || '',
        ...(isCustomServingRuntimesEnabled && { 'openshift.io/display-name': displayName.trim() }),
      },
    };
  }

  delete updatedServingRuntime.spec.replicas;
  if (isModelMesh) {
    updatedServingRuntime.spec.replicas = numReplicas;
  }

  // Accelerator support

  const resourceSettings: ContainerResources = {
    requests: {
      cpu: modelSize.resources.requests?.cpu,
      memory: modelSize.resources.requests?.memory,
    },
    limits: {
      cpu: modelSize.resources.limits?.cpu,
      memory: modelSize.resources.limits?.memory,
    },
  };

  const { affinity, tolerations, resources } = assemblePodSpecOptions(
    resourceSettings,
    acceleratorProfileState,
    undefined,
    servingRuntime.spec.tolerations,
    undefined,
    updatedServingRuntime.spec.containers[0]?.resources,
  );

  updatedServingRuntime.spec.containers = servingRuntime.spec.containers.map(function mapContainer(
    container,
  ): ServingContainer {
    const volumeMounts = container.volumeMounts || [];
    if (!volumeMounts.find((volumeMount) => volumeMount.mountPath === '/dev/shm')) {
      volumeMounts.push(getshmVolumeMount());
    }

    return {
      ...container,
      resources: isModelMesh ? resources : resourceSettings,
      affinity,
      volumeMounts,
    };
  });

  updatedServingRuntime.spec.tolerations = isModelMesh
    ? tolerations
    : servingRuntime.spec.tolerations;

  // Volume mount for /dev/shm
  const volumes = updatedServingRuntime.spec.volumes || [];
  if (!volumes.find((volume) => volume.name === 'shm')) {
    volumes.push(getshmVolume('2Gi'));
  }

  updatedServingRuntime.spec.volumes = volumes;

  return updatedServingRuntime;
};

export const listServingRuntimes = (
  namespace?: string,
  labelSelector?: string,
): Promise<ServingRuntimeKind[]> => {
  const queryOptions = {
    ...(namespace && { ns: namespace }),
    ...(labelSelector && { queryParams: { labelSelector } }),
  };
  return k8sListResource<ServingRuntimeKind>({
    model: ServingRuntimeModel,
    queryOptions,
  }).then((listResource) => listResource.items);
};

export const listScopedServingRuntimes = (labelSelector?: string): Promise<ServingRuntimeKind[]> =>
  getModelServingProjects().then((projects) =>
    Promise.all(
      projects.map((project) => listServingRuntimes(project.metadata.name, labelSelector)),
    ).then((listServingRuntimes) =>
      _.uniqBy(_.flatten(listServingRuntimes), (sr) => sr.metadata.name),
    ),
  );

export const getServingRuntimeContext = (
  namespace?: string,
  labelSelector?: string,
): Promise<ServingRuntimeKind[]> => {
  if (namespace) {
    return listServingRuntimes(namespace, labelSelector);
  }
  return listScopedServingRuntimes(labelSelector);
};

export const getServingRuntime = (name: string, namespace: string): Promise<ServingRuntimeKind> =>
  k8sGetResource<ServingRuntimeKind>({
    model: ServingRuntimeModel,
    queryOptions: { name, ns: namespace },
  });

export const updateServingRuntime = (options: {
  data: CreatingServingRuntimeObject;
  existingData: ServingRuntimeKind;
  isCustomServingRuntimesEnabled: boolean;
  opts?: K8sAPIOptions;
  acceleratorProfileState?: AcceleratorProfileState;
  isModelMesh?: boolean;
}): Promise<ServingRuntimeKind> => {
  const {
    data,
    existingData,
    isCustomServingRuntimesEnabled,
    opts,
    acceleratorProfileState,
    isModelMesh,
  } = options;

  const updatedServingRuntime = assembleServingRuntime(
    data,
    existingData.metadata.namespace,
    existingData,
    isCustomServingRuntimesEnabled,
    true,
    acceleratorProfileState,
    isModelMesh,
  );

  return k8sUpdateResource<ServingRuntimeKind>(
    applyK8sAPIOptions(opts, {
      model: ServingRuntimeModel,
      resource: updatedServingRuntime,
    }),
  );
};

export const createServingRuntime = (options: {
  data: CreatingServingRuntimeObject;
  namespace: string;
  servingRuntime: ServingRuntimeKind;
  isCustomServingRuntimesEnabled: boolean;
  opts?: K8sAPIOptions;
  acceleratorProfileState?: AcceleratorProfileState;
  isModelMesh?: boolean;
}): Promise<ServingRuntimeKind> => {
  const {
    data,
    namespace,
    servingRuntime,
    isCustomServingRuntimesEnabled,
    opts,
    acceleratorProfileState,
    isModelMesh,
  } = options;
  const assembledServingRuntime = assembleServingRuntime(
    data,
    namespace,
    servingRuntime,
    isCustomServingRuntimesEnabled,
    false,
    acceleratorProfileState,
    isModelMesh,
  );

  return k8sCreateResource<ServingRuntimeKind>(
    applyK8sAPIOptions(opts, {
      model: ServingRuntimeModel,
      resource: assembledServingRuntime,
    }),
  );
};

export const deleteServingRuntime = (
  name: string,
  namespace: string,
  opts?: K8sAPIOptions,
): Promise<ServingRuntimeKind> =>
  k8sDeleteResource<ServingRuntimeKind>(
    applyK8sAPIOptions(opts, {
      model: ServingRuntimeModel,
      queryOptions: { name, ns: namespace },
    }),
  );
