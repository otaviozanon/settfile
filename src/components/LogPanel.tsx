import React from "react";
import { Trash2 } from "lucide-react";

interface Props {
  logs: string[];
  onClear: () => void;
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
}

export const LogPanel: React.FC<Props> = ({ logs, setLogs }) => {
  const handleClearAnimated = () => {
    const copy = [...logs];
    const interval = setInterval(() => {
      if (copy.length === 0) {
        clearInterval(interval);
        return;
      }
      copy.pop();
      setLogs([...copy]);
    }, 150);
  };

  return (
    <div className="log-panel-wrapper">
      <div className="log-panel-header">
        <button
          type="button"
          onClick={handleClearAnimated}
          className="clear-logs-btn"
          title="Clear logs"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="log-panel" aria-live="polite">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
};
