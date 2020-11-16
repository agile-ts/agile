import React from "react";

export interface Props {
  error?: string;
}

const ErrorMessage: React.FC<Props> = (props) => {
  if (props.error) return <p>{props.error}</p>;
  return null;
};

export default ErrorMessage;
