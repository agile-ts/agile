import React from 'react';
import styled from 'styled-components';

interface PageContainerProps {
  onClick: () => void;
}

const PageContainer: React.FC<PageContainerProps> = (props) => {
  const { onClick, children } = props;

  return <Container onClick={onClick}>{children}</Container>;
};

export default PageContainer;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vw;
`;
