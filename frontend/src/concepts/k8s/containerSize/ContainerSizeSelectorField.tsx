import * as React from 'react';
import { FormGroup, Select, SelectOption, Stack, StackItem } from '@patternfly/react-core';
import IndentSection from '~/pages/projects/components/IndentSection';
import { GenericContainerSize } from '~/types';
import { getSizeDescription } from './utils';
import CustomContainerSizeField from './CustomContainerSizeField';

type ContainerSizeSelectorFieldProps = {
  selection?: GenericContainerSize;
  onSelection: (selection: GenericContainerSize) => void;
  customSizes: GenericContainerSize[];
  label: string;
  placeholder?: string;
};

const ContainerSizeSelectorField: React.FC<ContainerSizeSelectorFieldProps> = ({
  selection,
  onSelection,
  customSizes,
  label,
  placeholder = 'Select size',
}) => {
  const [sizeDropdownOpen, setSizeDropdownOpen] = React.useState(false);

  const sizes: GenericContainerSize[] = [
    ...customSizes,
    {
      name: 'Custom',
      resources: {},
    },
  ];
  return (
    <FormGroup label={label}>
      <Stack hasGutter>
        <StackItem>
          <Select
            removeFindDomNode
            id="container-size-selection"
            isOpen={sizeDropdownOpen}
            placeholderText={placeholder}
            onToggle={(open) => setSizeDropdownOpen(open)}
            onSelect={(_, option) => {
              const valuesSelected = sizes.find((size) => size.name === option);
              if (valuesSelected) {
                onSelection(valuesSelected);
              }
              setSizeDropdownOpen(false);
            }}
            selections={selection?.name}
            menuAppendTo={() => document.body}
          >
            {sizes.map((size) => {
              const name = size.name;
              const desc = name !== 'Custom' ? getSizeDescription(size) : '';

              return <SelectOption key={name} value={name} description={desc} />;
            })}
          </Select>
        </StackItem>
        {selection?.name === 'Custom' && (
          <StackItem>
            <IndentSection>
              <CustomContainerSizeField size={selection} onChange={onSelection} />
            </IndentSection>
          </StackItem>
        )}
      </Stack>
    </FormGroup>
  );
};

export default ContainerSizeSelectorField;
