import React, { useEffect, useState } from 'react';
import { Box, Text, VStack } from '@chakra-ui/layout';
import { Skeleton } from '@chakra-ui/skeleton';
import { callApi } from '../../../api';
import { SELECTED_ELEMENT } from '../../../core/entities/ui/ui.controller';
import { useAgile } from '@agile-ts/react';

export const ImageInfo = () => {
  const element = useAgile(SELECTED_ELEMENT);
  const [imageInfo, setImageInfo] = useState<{
    author: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    if (element?.image) {
      callApi('image-details', {
        queryParams: { seed: element.image.id },
      }).then((value) => {
        setImageInfo(value);
      });
    }
  }, [element?.image?.id]);

  return (
    <VStack spacing={2} alignItems="flex-start" width="100%">
      <Info label="Author" value={imageInfo?.author} />
      <Info label="Image URL" value={imageInfo?.url} />
    </VStack>
  );
};

export const ImageInfoFallback = () => {
  return (
    <VStack spacing={2} alignItems="flex-start" width="100%">
      <Info label="Author" />
      <Info label="Image URL" />
    </VStack>
  );
};

export const Info = ({ label, value }: { label: string; value?: string }) => {
  return (
    <Box width="175px">
      <Text fontSize="14px" fontWeight="500" mb="2px">
        {label}
      </Text>
      {value === undefined ? (
        <Skeleton width="100%" height="21px" />
      ) : (
        <Text fontSize="14px">{value}</Text>
      )}
    </Box>
  );
};
