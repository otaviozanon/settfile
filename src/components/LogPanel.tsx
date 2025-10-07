import React from "react";

interface Props {
  logs: string[];
}

export const LogPanel: React.FC<Props> = ({ logs }) => {
  return (
    <div className="log-panel" aria-live="polite">
      {logs.map((log, i) => (
        <div key={i}>{log}</div>
      ))}
    </div>
  );
};
