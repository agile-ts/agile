import core from '../../../../core';
import { useProxy } from '@agile-ts/react';
import lodash from 'lodash';
import React from 'react';
import PropertyInput from './components/PropertyInput';

interface PropertyProps {
  label: string;
  path: string;
  id: number | string;
  onChange: (newValue: number) => void;
}

const Property: React.FC<PropertyProps> = (props) => {
  const { label, path, id, onChange } = props;

  const ELEMENT = core.ui.ELEMENTS.getItem(id);
  const element = useProxy(ELEMENT, { componentId: 'Property', deps: [id] });

  return (
    <PropertyInput
      label={label}
      value={lodash.get(element, path)}
      onChange={onChange}
    />
  );
};

export default Property;
