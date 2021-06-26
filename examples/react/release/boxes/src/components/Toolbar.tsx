import React from 'react';
import { Icon, IconButton, VStack } from '@chakra-ui/react';
import { Image, Square } from 'react-feather';
import core from '../core';
import { generateId } from '@agile-ts/core';

export const Toolbar = () => {
  return (
    <VStack
      position="absolute"
      top="20px"
      left="20px"
      backgroundColor="white"
      padding={2}
      boxShadow="md"
      borderRadius="md"
      spacing={2}>
      <IconButton
        onClick={() => {
          core.ui.ELEMENTS.collect({
            id: generateId(),
            style: core.ui.defaultElementStyle,
          });
        }}
        aria-label="Add rectangle"
        icon={<Icon style={{ width: 24, height: 24 }} as={Square} />}
      />
      <IconButton
        onClick={() => {
          core.ui.ELEMENTS.collect({
            id: generateId(),
            style: core.ui.defaultElementStyle,
            image: core.ui.getRandomImage(),
          });
        }}
        aria-label="Add image"
        icon={<Icon style={{ width: 24, height: 24 }} as={Image} />}
      />
    </VStack>
  );
};
