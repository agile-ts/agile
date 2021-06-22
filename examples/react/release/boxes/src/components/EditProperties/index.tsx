import React, { Suspense } from 'react';
import {
  InputGroup,
  InputRightElement,
  NumberInput,
  NumberInputField,
  Text,
  VStack,
} from '@chakra-ui/react';
import _ from 'lodash';
import { ImageInfo, ImageInfoFallback } from './components/ImageInfo';
import { useProxy } from '@agile-ts/react';
import core from '../../core';

export const EditProperties = () => {
  const selectedElement = useProxy(core.ui.SELECTED_ELEMENT);

  if (selectedElement == null) return null;

  return (
    <Card>
      <Section heading="Position">
        <Property
          label="Top"
          path="style.position.top"
          id={selectedElement.id}
        />
        <Property
          label="Left"
          path="style.position.left"
          id={selectedElement.id}
        />
      </Section>
      <Section heading="Size">
        <SizeProperty label="Width" dimension="width" id={selectedElement.id} />
        <SizeProperty
          label="Height"
          dimension="height"
          id={selectedElement.id}
        />
      </Section>
      {selectedElement.image != null && (
        <Section heading="Image">
          <Suspense fallback={<ImageInfoFallback />}>
            <ImageInfo />
          </Suspense>
        </Section>
      )}
    </Card>
  );
};

const Section: React.FC<{ heading: string }> = ({ heading, children }) => {
  return (
    <VStack spacing={2} align="flex-start">
      <Text fontWeight="500">{heading}</Text>
      {children}
    </VStack>
  );
};

const SizeProperty = ({
  label,
  dimension,
  id,
}: {
  label: string;
  dimension: 'width' | 'height';
  id: number | string;
}) => {
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

const Property = ({
  label,
  path,
  id,
}: {
  label: string;
  path: string;
  id: number | string;
}) => {
  const ELEMENT = core.ui.ELEMENTS.getItem(id);
  const element = useProxy(ELEMENT, { componentId: 'Property' });
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

const PropertyInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) => {
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

const Card: React.FC = ({ children }) => (
  <VStack
    position="absolute"
    top="20px"
    right="20px"
    backgroundColor="white"
    padding={2}
    boxShadow="md"
    borderRadius="md"
    spacing={3}
    align="flex-start"
    onClick={(e) => e.stopPropagation()}>
    {children}
  </VStack>
);
