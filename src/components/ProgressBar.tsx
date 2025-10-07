import React from "react";

interface Props {
  progress: number;
}

export const ProgressBar: React.FC<Props> = ({ progress }) => {
  return (
    <div className="progress-bar" aria-hidden="false" title="Progresso">
      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
    </div>
  );
};
