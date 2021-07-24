import React from 'react';
import styled from 'styled-components';

interface PropertyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const PropertyInput: React.FC<PropertyInputProps> = (props) => {
  const { label, value, onChange } = props;
  const [currentValue, setCurrentValue] = React.useState<string>(
    value.toString()
  );
  const [lastValue, setLastValue] = React.useState<string>(value.toString());

  React.useEffect(() => {
    setCurrentValue(value.toString());
    setLastValue(value.toString());
  }, [value]);

  return (
    <>
      <Label>{label}</Label>
      <InputContainer>
        <Input
          value={currentValue}
          onChange={(event) => {
            const value = event.target.value.replace(/\D/g, '');
            setCurrentValue(value);
          }}
          inputMode={'numeric'}
          onFocus={() => {
            setLastValue(currentValue);
          }}
          onBlur={() => {
            if (/^\d+$/.test(currentValue)) {
              onChange(parseInt(currentValue));
            } else {
              setCurrentValue(lastValue);
            }
          }}
        />
        <PxInputLabel>px</PxInputLabel>
      </InputContainer>
    </>
  );
};

export default PropertyInput;

const Label = styled.div`
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 5px;
`;

const InputContainer = styled.div`
  position: relative;
`;

const PxInputLabel = styled.div`
  position: absolute;
  top: 15%;
  right: 10px;
  text-align: center;

  font-size: 12px;
`;

const Input = styled.input`
  display: block;
  box-sizing: border-box;
  width: 100%;
  border-radius: 4px;
  border: 1px solid #dce8f3;
  background-color: #edf2f7;
  padding: 5px 10px;
  margin-bottom: 10px;
  font-size: 14px;

  :hover {
    background-color: #deebf3;
  }

  :focus {
    background-color: #ffffff;
  }
`;
