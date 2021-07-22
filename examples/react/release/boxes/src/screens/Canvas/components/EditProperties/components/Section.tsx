import React from 'react';
import styled from 'styled-components';

interface SectionProps {
  heading: string;
}

const Section: React.FC<SectionProps> = (props) => {
  const { heading, children } = props;

  return (
    <Container>
      <Label>{heading}</Label>
      {children}
    </Container>
  );
};

export default Section;

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.div`
  font-weight: 500;
  margin-bottom: 10px;
`;
