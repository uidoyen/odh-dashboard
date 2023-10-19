import * as React from 'react';
import { FormGroup, FormSection, NumberInput } from '@patternfly/react-core';
import { UpdateObjectAtPropAndValue } from '~/pages/projects/types';
import {
  CreatingServingRuntimeObject,
  ServingRuntimeSize,
} from '~/pages/modelServing/screens/types';
import useGPUSetting from '~/pages/notebookController/screens/server/useGPUSetting';
import { ServingRuntimeKind } from '~/k8sTypes';
import { isGpuDisabled } from '~/pages/modelServing/screens/projects/utils';
import ContainerSizeSelectorField from '~/concepts/k8s/containerSize/ContainerSizeSelectorField';
import { GenericContainerSize } from '~/types';

type ServingRuntimeSizeSectionProps = {
  data: CreatingServingRuntimeObject;
  setData: UpdateObjectAtPropAndValue<CreatingServingRuntimeObject>;
  sizes: ServingRuntimeSize[];
  servingRuntimeSelected?: ServingRuntimeKind;
};

const ServingRuntimeSizeSection: React.FC<ServingRuntimeSizeSectionProps> = ({
  data,
  setData,
  sizes,
  servingRuntimeSelected,
}) => {
  const { available: gpuAvailable, count: gpuCount } = useGPUSetting('autodetect');

  const gpuDisabled = servingRuntimeSelected ? isGpuDisabled(servingRuntimeSelected) : false;

  return (
    <FormSection title="Compute resources per replica">
      <ContainerSizeSelectorField
        selection={data.modelSize}
        onSelection={(size: GenericContainerSize) => {
          setData('modelSize', size);
        }}
        customSizes={sizes}
        label="Model server size"
      />

      {gpuAvailable && !gpuDisabled && (
        <FormGroup label="Model server GPUs">
          <NumberInput
            isDisabled={!gpuCount}
            value={data.gpus}
            widthChars={10}
            min={0}
            max={gpuCount}
            onChange={(event: React.FormEvent<HTMLInputElement>) => {
              const target = event.currentTarget;
              setData('gpus', parseInt(target.value) || 0);
            }}
            onBlur={(event: React.FormEvent<HTMLInputElement>) => {
              const target = event.currentTarget;
              const gpuInput = parseInt(target.value) || 0;
              setData('gpus', Math.max(0, Math.min(gpuCount, gpuInput)));
            }}
            onMinus={() => setData('gpus', data.gpus - 1)}
            onPlus={() => setData('gpus', data.gpus + 1)}
          />
        </FormGroup>
      )}
    </FormSection>
  );
};

export default ServingRuntimeSizeSection;
