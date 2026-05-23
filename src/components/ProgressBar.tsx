import React from "react";

interface Props {
  progress: number;
}

export const ProgressBar = React.memo<Props>(({ progress }) => {
  return (
    <div
      className="progress-bar"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Upload progress"
    >
      <div className="progress-fill" style={{ width: `${progress}%` }} />
    </div>
  );
});
