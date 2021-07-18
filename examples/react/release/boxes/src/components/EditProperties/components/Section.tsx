import React from 'react';
import { Text, VStack } from '@chakra-ui/react';

interface SectionProps {
  heading: string;
}

const Section: React.FC<SectionProps> = (props) => {
  const { heading, children } = props;

  return (
    <VStack spacing={2} align="flex-start">
      <Text fontWeight="500">{heading}</Text>
      {children}
    </VStack>
  );
};

export default Section;
