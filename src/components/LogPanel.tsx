import React from "react";
import { Trash2 } from "lucide-react";

interface Props {
  logs: string[];
  onClear: () => void;
}

export const LogPanel: React.FC<Props> = ({ logs, onClear }) => {
  return (
    <div className="log-panel-wrapper">
      <div className="log-panel-header">
        <button
          type="button"
          onClick={onClear}
          className="clear-logs-btn"
          title="Limpar logs"
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
