import React from 'react';
import { Box, Flex } from '@chakra-ui/react';

interface PageContainerProps {
  onClick: () => void;
}

export const PageContainer: React.FC<PageContainerProps> = (props) => {
  const { onClick, children } = props;

  return (
    <Flex direction="column" width="100vw" height="100vh" onClick={onClick}>
      <Box flex={1} position="relative">
        {children}
      </Box>
    </Flex>
  );
};
