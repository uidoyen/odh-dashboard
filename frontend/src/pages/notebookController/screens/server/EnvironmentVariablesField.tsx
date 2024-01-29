import * as React from 'react';
import {
  Button,
  Checkbox,
  Flex,
  FormGroup,
  InputGroup,
  TextInput,
  TextInputTypes,
  InputGroupItem,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from '@patternfly/react-icons';
import { CUSTOM_VARIABLE, EMPTY_KEY } from '~/pages/notebookController/const';
import { EnvVarType, VariableRow } from '~/types';

import '~/pages/notebookController/NotebookController.scss';

type EnvironmentVariablesFieldProps = {
  fieldIndex: string;
  variable: EnvVarType;
  variableRow: VariableRow;
  onUpdateVariable: (updatedVariable: EnvVarType) => void;
};

const EnvironmentVariablesField: React.FC<EnvironmentVariablesFieldProps> = ({
  fieldIndex,
  variable,
  onUpdateVariable,
  variableRow,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [variableType, setVariableType] = React.useState<string>(variable.type);

  React.useEffect(() => {
    setVariableType(variable.type);
  }, [variable.type]);

  const handleSecretChange = (checked: boolean) => {
    const updatedVariable = { ...variable };
    updatedVariable.type = checked ? 'password' : 'text';
    setVariableType(updatedVariable.type);
  };

  const validated = variableRow.errors[variable.name] !== undefined ? 'error' : 'default';
  return (
    <div className="odh-notebook-controller__env-var-field">
      <FormGroup
        className="odh-notebook-controller__env-var-field__name"
        fieldId={`${fieldIndex}-${variable.name}`}
        label="Variable name"
      >
        <TextInput
          id={`${fieldIndex}-${variable.name}`}
          data-id={`${fieldIndex}-${variable.name}`}
          type={TextInputTypes.text}
          onChange={(e, newKey) =>
            onUpdateVariable({ name: newKey, type: variable.type, value: variable.value })
          }
          value={variable.name === EMPTY_KEY ? '' : variable.name}
          validated={validated}
        />
        {validated === 'error' && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem icon={<ExclamationCircleIcon />} variant="error">
                {variableRow.errors[variable.name]}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>
      <FormGroup
        className="odh-notebook-controller__env-var-field__value"
        fieldId={`${fieldIndex}-${variable.name}-value`}
        label="Variable value"
      >
        <Flex>
          <InputGroup>
            <InputGroupItem isFill>
              <TextInput
                id={`${fieldIndex}-${variable.name}-value`}
                data-id={`${fieldIndex}-${variable.name}-value`}
                type={
                  showPassword && variableType === 'password'
                    ? TextInputTypes.text
                    : (variable.type as TextInputTypes)
                }
                value={variable.value}
                onChange={(e, newValue) =>
                  onUpdateVariable({ name: variable.name, type: variable.type, value: newValue })
                }
              />
            </InputGroupItem>
            {variable.type === 'password' ? (
              <Button
                data-id="show-password-button"
                variant="control"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </Button>
            ) : null}
          </InputGroup>
          {variableRow.variableType === CUSTOM_VARIABLE ? (
            <Checkbox
              data-id={`${fieldIndex}-${variable.name}-secret`}
              className={variableType === 'password' ? ' m-is-secret' : ''}
              label="Secret"
              isChecked={variableType === 'password'}
              onChange={(e, checked: boolean) => handleSecretChange(checked)}
              aria-label="secret"
              id={`${fieldIndex}-${variable.name}-secret`}
              name="secret"
            />
          ) : null}
        </Flex>
      </FormGroup>
    </div>
  );
};

export default EnvironmentVariablesField;
