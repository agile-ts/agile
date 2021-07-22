import React from 'react';
import { SELECTED_ELEMENT } from '../../../../../../core/entities/ui/ui.controller';
import { useProxy } from '@agile-ts/react';
import core from '../../../../../../core';
import Info from './components/Info';
import styled from 'styled-components';

type ImageInfoProps = {
  fallback?: boolean;
};

const ImageInfo: React.FC<ImageInfoProps> = (props) => {
  const { fallback } = props;

  const element = useProxy(SELECTED_ELEMENT);
  const [imageInfo, setImageInfo] = React.useState<{
    author: string;
    url: string;
  } | null>(null);

  React.useEffect(() => {
    const imageId = element?.image?.id;
    if (imageId != null) {
      core.ui.fetchImage(imageId).then((value) => {
        setImageInfo(value);
      });
    }
  }, [element?.image?.id]);

  return (
    <Container>
      <Info label="Author" value={imageInfo?.author} />
      <Info label="Image URL" value={imageInfo?.url} />
    </Container>
  );
};

export default ImageInfo;

const Container = styled.div`
  align-items: flex-start;
  width: 100%;
  margin-bottom: 10px;
`;
