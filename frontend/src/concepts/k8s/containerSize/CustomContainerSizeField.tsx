import * as React from 'react';
import { FormGroup, Grid } from '@patternfly/react-core';
import CPUField from '~/components/CPUField';
import MemoryField from '~/components/MemoryField';
import { GenericContainerSize } from '~/types';

type CustomContainerSizeFieldProps = {
  size: GenericContainerSize;
  onChange: (size: GenericContainerSize) => void;
};

const CustomContainerSizeField: React.FC<CustomContainerSizeFieldProps> = ({ size, onChange }) => {
  const handleChange = (type: 'limits' | 'requests', kind: 'cpu' | 'memory') => (value: string) => {
    onChange({
      ...size,
      resources: { ...size.resources, [type]: { ...size.resources[type], [kind]: value } },
    });
  };
  const handleLimitCPUChange = handleChange('limits', 'cpu');
  const handleLimitMemoryChange = handleChange('limits', 'memory');
  const handleRequestCPUChange = handleChange('requests', 'cpu');
  const handleRequestMemoryChange = handleChange('requests', 'memory');

  return (
    <Grid hasGutter md={6}>
      <FormGroup label="CPUs requested">
        <CPUField onChange={handleRequestCPUChange} value={size.resources.requests?.cpu} />
      </FormGroup>
      <FormGroup label="Memory requested">
        <MemoryField onChange={handleRequestMemoryChange} value={size.resources.requests?.memory} />
      </FormGroup>
      <FormGroup label="CPU limit">
        <CPUField onChange={handleLimitCPUChange} value={size.resources?.limits?.cpu} />
      </FormGroup>
      <FormGroup label="Memory limit">
        <MemoryField onChange={handleLimitMemoryChange} value={size.resources?.limits?.memory} />
      </FormGroup>
    </Grid>
  );
};

export default CustomContainerSizeField;
