import core from '../../../core';
import { useProxy } from '@agile-ts/react';
import _ from 'lodash';
import React from 'react';
import PropertyInput from './PropertyInput';

interface SizePropertyProps {
  label: string;
  dimension: 'width' | 'height';
  id: number | string;
}

const SizeProperty: React.FC<SizePropertyProps> = (props) => {
  const { label, dimension, id } = props;

  const ELEMENT = core.ui.ELEMENTS.getItem(id);
  const element = useProxy(ELEMENT, { componentId: 'SizeProperty' });
  return (
    <PropertyInput
      label={label}
      value={_.get(element, `style.size.${dimension}`)}
      onChange={(newValue) => {
        if (!element) return;

        // Handle no Image Element with no aspectRatio
        if (!element.image) {
          ELEMENT?.set((v) => {
            return _.set(v, `style.size.${dimension}`, newValue);
          });
          return;
        }

        // Handle Image Element with aspectRatio
        const { width, height } = element.style.size;
        const aspectRatio = width / height;
        if (dimension === 'width') {
          ELEMENT?.set((v) => {
            return _.set(v, `style.size`, {
              width: newValue,
              height: Math.round(newValue / aspectRatio),
            });
          });
        }
        if (dimension === 'height') {
          ELEMENT?.set((v) => {
            return _.set(v, `style.size`, {
              width: Math.round(newValue * aspectRatio),
              height: newValue,
            });
          });
        }
      }}
    />
  );
};

export default SizeProperty;
