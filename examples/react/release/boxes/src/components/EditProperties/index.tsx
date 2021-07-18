import React, { Suspense } from 'react';
// @ts-ignore
import _ from 'lodash';
import { ImageInfo, ImageInfoFallback } from './components/ImageInfo';
import { useSelector } from '@agile-ts/react';
import core from '../../core';
import { ElementImageInterface } from '../../core/entities/ui/ui.interfaces';
import Card from '../Card';
import Section from './components/Section';
import Property from './components/Property';
import SizeProperty from './components/SizeProperty';

export const EditProperties = () => {
  const selectedElementId = useSelector(
    core.ui.SELECTED_ELEMENT,
    (value) => value?.id
  ) as number | string;
  const selectedElementImage = useSelector(
    core.ui.SELECTED_ELEMENT,
    (value) => value?.image
  ) as ElementImageInterface;

  // TODO useProxy doesn't work here as expected because the selected Elements
  //  doesn't exist on the creation of the Subscription Container
  //  -> no Selector was created selecting this property
  // const selectedElement = useProxy(core.ui.SELECTED_ELEMENT, {
  //   componentId: 'EditProperties',
  // });
  // const selectedElementId = selectedElement?.id;
  // const selectedElementImage = selectedElement?.image;

  if (selectedElementId == null) return null;

  return (
    <Card>
      <Section heading="Position">
        <Property
          label="Top"
          path="style.position.top"
          id={selectedElementId}
        />
        <Property
          label="Left"
          path="style.position.left"
          id={selectedElementId}
        />
      </Section>
      <Section heading="Size">
        <SizeProperty label="Width" dimension="width" id={selectedElementId} />
        <SizeProperty
          label="Height"
          dimension="height"
          id={selectedElementId}
        />
      </Section>
      {selectedElementImage != null && (
        <Section heading="Image">
          <Suspense fallback={<ImageInfoFallback />}>
            <ImageInfo />
          </Suspense>
        </Section>
      )}
    </Card>
  );
};
