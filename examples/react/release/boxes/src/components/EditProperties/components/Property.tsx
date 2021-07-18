import core from '../../../core';
import { useProxy } from '@agile-ts/react';
import _ from 'lodash';
import React from 'react';
import PropertyInput from './PropertyInput';

interface PropertyProps {
  label: string;
  path: string;
  id: number | string;
}

const Property: React.FC<PropertyProps> = (props) => {
  const { label, path, id } = props;
  const ELEMENT = core.ui.ELEMENTS.getItem(id);
  const element = useProxy(ELEMENT, { componentId: 'Property', deps: [id] });

  return (
    <PropertyInput
      label={label}
      value={_.get(element, path)}
      onChange={(newValue) => {
        ELEMENT?.set((v) => {
          return _.set(v, path, newValue);
        });
      }}
    />
  );
};

export default Property;
