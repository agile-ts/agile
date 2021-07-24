import React from 'react';
import ImageInfo from './components/ImageInfo';
import { useSelector } from '@agile-ts/react';
import core from '../../../../core';
import { ElementImageInterface } from '../../../../core/entities/ui/ui.interfaces';
import Card from './components/Card';
import Section from './components/Section';
import Property from './components/Property';

const EditProperties: React.FC = () => {
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
          onChange={(newValue) => {
            core.ui.updateElementY(selectedElementId, newValue);
          }}
        />
        <Property
          label="Left"
          path="style.position.left"
          id={selectedElementId}
          onChange={(newValue) => {
            core.ui.updateElementX(selectedElementId, newValue);
          }}
        />
      </Section>
      <Section heading="Size">
        <Property
          label="Width"
          path="style.size.width"
          id={selectedElementId}
          onChange={(newValue) => {
            core.ui.updateElementWidth(selectedElementId, newValue);
          }}
        />
        <Property
          label="Height"
          path="style.size.height"
          id={selectedElementId}
          onChange={(newValue) => {
            core.ui.updateElementHeight(selectedElementId, newValue);
          }}
        />
      </Section>
      {selectedElementImage != null && (
        <Section heading="Image">
          <React.Suspense fallback={<ImageInfo fallback />}>
            <ImageInfo />
          </React.Suspense>
        </Section>
      )}
    </Card>
  );
};

export default EditProperties;
