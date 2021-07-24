import React from 'react';
import { Image, Square } from 'react-feather';
import core from '../../../core';
import styled from 'styled-components';

const Toolbar = () => {
  return (
    <Container>
      <ActionButton
        onClick={() => {
          core.ui.addDefaultElement();
        }}
        aria-label="Add rectangle">
        <Square width={24} height={24} />
      </ActionButton>
      <ActionButton
        onClick={() => {
          core.ui.addDefaultElement(true);
        }}
        aria-label="Add image">
        <Image width={24} height={24} />
      </ActionButton>
    </Container>
  );
};

export default Toolbar;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 20px;
  left: 20px;
  background: #ffffff;
  padding: 5px;
  border-radius: 4px;
  box-shadow: rgba(99, 99, 99, 0.2) 0 2px 8px 0;
  z-index: 1000;
`;

const ActionButton = styled.div`
  border-radius: 4px;
  background: #edf2f7;
  margin: 2px;
  padding: 5px;
  cursor: pointer;

  :hover {
    background: #dde7ff;
  }
`;
