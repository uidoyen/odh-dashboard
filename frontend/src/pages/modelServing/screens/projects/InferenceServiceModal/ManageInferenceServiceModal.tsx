import * as React from 'react';
import {
  Form,
  FormGroup,
  FormSection,
  Modal,
  TextInput,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { EitherOrNone } from '@openshift/dynamic-plugin-sdk';
import { useCreateInferenceServiceObject } from '~/pages/modelServing/screens/projects/utils';
import {
  assembleSecret,
  createInferenceService,
  createSecret,
  updateInferenceService,
} from '~/api';
import { InferenceServiceKind, ProjectKind, SecretKind, ServingRuntimeKind } from '~/k8sTypes';
import { InferenceServiceNotificationsContext } from '~/app/InferenceServiceNotificationsContext';
import { DataConnection } from '~/pages/projects/types';
import DashboardModalFooter from '~/concepts/dashboard/DashboardModalFooter';
import { InferenceServiceStorageType } from '~/pages/modelServing/screens/types';
import { isAWSValid } from '~/pages/projects/screens/spawner/spawnerUtils';
import { AWS_KEYS } from '~/pages/projects/dataConnections/const';
import DataConnectionSection from './DataConnectionSection';
import ProjectSection from './ProjectSection';
import InferenceServiceFrameworkSection from './InferenceServiceFrameworkSection';
import InferenceServiceServingRuntimeSection from './InferenceServiceServingRuntimeSection';

type ManageInferenceServiceModalProps = {
  isOpen: boolean;
  onClose: (submit: boolean) => void;
} & EitherOrNone<
  { editInfo?: InferenceServiceKind },
  {
    projectContext?: {
      currentProject: ProjectKind;
      currentServingRuntime: ServingRuntimeKind;
      dataConnections: DataConnection[];
    };
  }
>;

const ManageInferenceServiceModal: React.FC<ManageInferenceServiceModalProps> = ({
  isOpen,
  onClose,
  editInfo,
  projectContext,
}) => {
  const [createData, setCreateData, resetData] = useCreateInferenceServiceObject(editInfo);
  const [actionInProgress, setActionInProgress] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>();
  const { getModelDeploymentInfo } = React.useContext(InferenceServiceNotificationsContext);

  React.useEffect(() => {
    if (projectContext) {
      const { currentProject, currentServingRuntime } = projectContext;
      setCreateData('project', currentProject.metadata.name);
      setCreateData('servingRuntimeName', currentServingRuntime.metadata.name);
    }
  }, [projectContext, setCreateData]);

  const storageCanCreate = (): boolean => {
    if (createData.storage.type === InferenceServiceStorageType.EXISTING_STORAGE) {
      return createData.storage.dataConnection !== '';
    }
    return isAWSValid(createData.storage.awsData, [AWS_KEYS.AWS_S3_BUCKET]);
  };

  const canCreate =
    !actionInProgress &&
    createData.name.trim() !== '' &&
    createData.project !== '' &&
    createData.format.name !== '' &&
    createData.project !== '' &&
    createData.storage.path !== '' &&
    createData.storage.path !== '/' &&
    !createData.storage.path.includes('//') &&
    storageCanCreate();

  const onBeforeClose = (submitted: boolean) => {
    onClose(submitted);
    setError(undefined);
    setActionInProgress(false);
    resetData();
  };

  const setErrorModal = (error: Error) => {
    setError(error);
    setActionInProgress(false);
  };

  const createAWSSecret = (): Promise<SecretKind> =>
    createSecret(
      assembleSecret(
        createData.project,
        createData.storage.awsData.reduce<Record<string, string>>(
          (acc, { key, value }) => ({ ...acc, [key]: value }),
          {},
        ),
        'aws',
      ),
    );

  const createModel = (): Promise<InferenceServiceKind> => {
    if (createData.storage.type === InferenceServiceStorageType.EXISTING_STORAGE) {
      return createInferenceService(createData);
    }
    return createAWSSecret().then((secret) =>
      createInferenceService(createData, secret.metadata.name),
    );
  };

  const updateModel = (): Promise<InferenceServiceKind> => {
    if (!editInfo) {
      return Promise.reject(new Error('No model to update'));
    }

    if (createData.storage.type === InferenceServiceStorageType.EXISTING_STORAGE) {
      return updateInferenceService(createData, editInfo);
    }
    return createAWSSecret().then((secret) =>
      updateInferenceService(createData, editInfo, secret.metadata.name),
    );
  };

  const submit = () => {
    setError(undefined);
    setActionInProgress(true);

    if (editInfo) {
      updateModel()
        .then(() => {
          setActionInProgress(false);
          onBeforeClose(true);
        })
        .catch(setErrorModal);
    } else {
      createModel()
        .then((inferenceService) => {
          getModelDeploymentInfo(inferenceService, inferenceService.metadata.name);
          setActionInProgress(false);
          onBeforeClose(true);
        })
        .catch(setErrorModal);
    }
  };

  return (
    <Modal
      title="Deploy model"
      description="Configure properties for deploying your model"
      variant="medium"
      isOpen={isOpen}
      onClose={() => onBeforeClose(false)}
      footer={
        <DashboardModalFooter
          submitLabel="Deploy"
          onSubmit={submit}
          onCancel={() => onBeforeClose(false)}
          isSubmitDisabled={!canCreate}
          error={error}
          alertTitle="Error creating model server"
        />
      }
      showClose
    >
      <Form>
        <Stack hasGutter>
          <StackItem>
            <ProjectSection
              data={createData}
              setData={setCreateData}
              editInfo={editInfo}
              project={projectContext?.currentProject}
            />
          </StackItem>
          <StackItem>
            <FormGroup label="Model Name" fieldId="inference-service-name-input" isRequired>
              <TextInput
                isRequired
                id="inference-service-name-input"
                value={createData.name}
                onChange={(name) => setCreateData('name', name)}
              />
            </FormGroup>
          </StackItem>
          <StackItem>
            <InferenceServiceServingRuntimeSection
              data={createData}
              setData={setCreateData}
              currentServingRuntime={projectContext?.currentServingRuntime}
            />
          </StackItem>
          <StackItem>
            <InferenceServiceFrameworkSection
              data={createData}
              setData={setCreateData}
              modelContext={projectContext?.currentServingRuntime?.spec.supportedModelFormats}
            />
          </StackItem>
          <StackItem>
            <FormSection title="Model location" id="model-location">
              <DataConnectionSection
                data={createData}
                setData={setCreateData}
                dataConnectionContext={projectContext?.dataConnections}
              />
            </FormSection>
          </StackItem>
        </Stack>
      </Form>
    </Modal>
  );
};

export default ManageInferenceServiceModal;
