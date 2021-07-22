import React, { useEffect, useState } from 'react';
import core from '../../../core';
import { useAgile } from '@agile-ts/react';
import { RectangleLoading } from './RectangleLoading';
import { ElementImageInterface } from '../../../core/entities/ui/ui.interfaces';
import styled from 'styled-components';
import { useRandomBorderRadius } from '../../../hooks/useRandomBorderRadius';

export interface RectangleInnerProps {
  selected: boolean;
  id: string | number;
}

export const RectangleInner: React.FC<RectangleInnerProps> = (props) => {
  const { selected, id } = props;

  const ELEMENT = core.ui.ELEMENTS.getItem(id);
  const element = useAgile(ELEMENT);
  const borderRadius = useRandomBorderRadius();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (element?.image?.src != null) {
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
  }, [element?.image?.src]);

  if (isLoading || element == null)
    return <RectangleLoading selected={selected} />;

  return (
    <Container borderColor={core.ui.getBorderColor(selected)}>
      <Content imageUrl={element.image?.src} borderRadius={borderRadius}>
        {element.id}
      </Content>
    </Container>
  );
};

const Container = styled.div<{ borderColor: string }>`
  display: flex;
  position: absolute;
  padding: 3px;
  border: ${(props) => `1px solid ${props.borderColor}`};
  width: 100%;
  height: 100%;

  transition: 0.1s border-bottom-color, border-left-color, border-top-color,
    border-right-color ease-in-out;
`;

const Content = styled.div<{ imageUrl?: string; borderRadius?: string }>`
  flex: 1;
  border: 3px dashed #101010;
  border-radius: ${(props) => props.borderRadius};
  background-image: ${(props) => `url('${props.imageUrl}')`};
  background-size: cover;
`;
