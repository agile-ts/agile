import React from 'react';

import styles from './Button.module.css';

type ButtonProps = {
  color?: string;
  onClick: () => void;
};

const Button: React.FC<ButtonProps> = (props) => {
  const { color, children, onClick } = props;

  return (
    <button
      type="button"
      style={{ color, border: `2px solid ${color}` }}
      className={styles.button}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;

Button.defaultProps = {
  color: 'blue',
};
