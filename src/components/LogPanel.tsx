import React from "react";
import { Trash2 } from "lucide-react";
import { LogEntry } from "../hooks/useLogger";

interface Props {
  logs: LogEntry[];
}

export const LogPanel = React.memo<Props>(({ logs }) => {
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
