import React from 'react';
import core from '../../../core';
import { useAgile } from '@agile-ts/react';
import RectangleLoading from './RectangleLoading';
import styled from 'styled-components';
import { useRandomBorderRadius } from '../../../hooks/useRandomBorderRadius';

export interface RectangleInnerProps {
  selected: boolean;
  id: string | number;
}

const RectangleInner: React.FC<RectangleInnerProps> = (props) => {
  const { selected, id } = props;

  const ELEMENT = core.ui.ELEMENTS.getItem(id);
  const element = useAgile(ELEMENT);
  const borderRadius = useRandomBorderRadius();

  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    core.ui.applyImageDimensions(id).then(() => setIsLoading(false));
  }, [id]);

  return (
    <Container borderColor={core.ui.getBorderColor(selected)}>
      {isLoading || element == null ? (
        <RectangleLoading borderRadius={borderRadius} />
      ) : (
        <Content imageUrl={element.image?.src} borderRadius={borderRadius} />
      )}
    </Container>
  );
};

export default RectangleInner;

const Container = styled.div<{ borderColor: string }>`
  display: flex;
  position: absolute;
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
  background-color: #ffffff; ;
`;
