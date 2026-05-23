import React from "react";
import { Trash2 } from "lucide-react";
import { LogEntry } from "../hooks/useLogger";

interface Props {
  logs: LogEntry[];
  onClear: () => void;
}

export const LogPanel = React.memo<Props>(({ logs, onClear }) => {
  const getLogColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "success":
        return "#0a0";
      case "error":
        return "#c00";
      case "warning":
        return "#f90";
      default:
        return "inherit";
    }
  };

  return (
    <div className="log-panel-wrapper">
      <div className="log-panel-header">
        <span className="log-title">System Logs</span>
        <button 
          onClick={onClear} 
          className="clear-logs-btn"
          title="Clear logs"
          disabled={logs.length === 0}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="log-panel" aria-live="polite">
        {logs.map((log) => (
          <div key={log.id} style={{ color: getLogColor(log.level) }}>
            [{log.timestamp}] {log.message}
          </div>
        ))}
      </div>
    </div>
  );
});
