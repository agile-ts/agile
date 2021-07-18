import React, { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import core from '../../../core';
import { useAgile } from '@agile-ts/react';
import { RectangleLoading } from './RectangleLoading';
import {
  ElementImageInterface,
  ElementInterface,
} from '../../../core/entities/ui/ui.interfaces';

export interface RectangleInnerProps {
  selected: boolean;
  id: string | number;
}

export const RectangleInner: React.FC<RectangleInnerProps> = (props) => {
  const { selected, id } = props;

  const ELEMENT = core.ui.ELEMENTS.getItem(id);
  const element = useAgile(ELEMENT);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (element?.image != null) {
      // Fetch Image size
      const loadImage = async (image: ElementImageInterface) => {
        setIsLoading(true);
        const response = await core.ui.getImageDimensions(image.src);
        setIsLoading(false);
        if (ELEMENT != null) {
          ELEMENT.nextStateValue.style.size = response;
          ELEMENT?.ingest();
        }
      };
      loadImage(element.image);
    } else {
      setIsLoading(false);
    }
  }, [element?.image]);

  if (isLoading || element == null)
    return <RectangleLoading selected={selected} />;

  return (
    <Box
      position="absolute"
      border={`1px solid ${core.ui.getBorderColor(selected)}`}
      transition="0.1s border-color ease-in-out"
      width="100%"
      height="100%"
      display="flex"
      padding="2px">
      <Box
        flex="1"
        border="3px dashed #101010"
        borderRadius="255px 15px 225px 15px/15px 225px 15px 255px"
        backgroundColor="white"
        backgroundImage={`url('${element.image?.src}')`}
        backgroundSize="cover"
        textAlign="center">
        {element.id}
      </Box>
    </Box>
  );
};
