import {
  InputGroup,
  InputRightElement,
  NumberInput,
  NumberInputField,
  Text,
} from '@chakra-ui/react';
import React from 'react';

interface PropertyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const PropertyInput: React.FC<PropertyInputProps> = (props) => {
  const { label, value, onChange } = props;

  return (
    <div>
      <Text fontSize="14px" fontWeight="500" mb="2px">
        {label}
      </Text>
      <InputGroup size="sm" variant="filled">
        <NumberInput value={value} onChange={(_, value) => onChange(value)}>
          <NumberInputField borderRadius="md" />
          <InputRightElement
            pointerEvents="none"
            children="px"
            lineHeight="1"
            fontSize="12px"
          />
        </NumberInput>
      </InputGroup>
    </div>
  );
};

export default PropertyInput;
