import React, { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import core from '../../../core';
import { useAgile } from '@agile-ts/react';
import { RectangleLoading } from './RectangleLoading';

export interface RectangleInnerPropsInterface {
  selected: boolean;
  id: string | number;
}

export const RectangleInner: React.FC<RectangleInnerPropsInterface> = (
  props
) => {
  const { selected, id } = props;

  const ELEMENT = core.ui.ELEMENTS.getItem(id);
  const element = useAgile(ELEMENT);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (element?.image != null) {
      setIsLoading(true);
      core.ui.getImageDimensions(element.image.src).then((response) => {
        setIsLoading(false);
        if (ELEMENT != null) {
          ELEMENT.nextStateValue.style.size = response;
          ELEMENT?.ingest();
        }
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) return <RectangleLoading selected={selected} />;

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
        backgroundImage={`url('${element?.image?.src}')`}
        backgroundSize="cover"
      />
    </Box>
  );
};
