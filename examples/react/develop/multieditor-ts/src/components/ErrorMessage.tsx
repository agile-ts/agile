import React from "react";

export interface Props {
  error?: string;
}

const ErrorMessage: React.FC<Props> = (props) => {
  if (props.error) return <p className={"error"}>{props.error}</p>;
  return null;
};

export default ErrorMessage;
