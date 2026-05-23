import { useState, useCallback } from 'react';

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'success' | 'error' | 'warning';
}

interface UseLoggerOptions {
  maxLogs?: number;
  timestampFormat?: 'time' | 'datetime';
}

export function useLogger(options: UseLoggerOptions = {}) {
  const { maxLogs = 50, timestampFormat = 'time' } = options;
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((
    message: string,
    level: LogEntry['level'] = 'info'
  ) => {
    const timestamp = timestampFormat === 'datetime'
      ? new Date().toLocaleString('en-US', { hour12: false })
      : new Date().toLocaleTimeString('en-US', { hour12: false });

    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp,
      message,
      level,
    };

    setLogs((prev) => [entry, ...prev].slice(0, maxLogs));
  }, [maxLogs, timestampFormat]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const clearLogsAnimated = useCallback((delay: number = 150) => {
    const copy = [...logs];
    const interval = setInterval(() => {
      if (copy.length === 0) {
        clearInterval(interval);
        return;
      }
      copy.pop();
      setLogs([...copy]);
    }, delay);
  }, [logs]);

  return {
    logs,
    addLog,
    clearLogs,
    clearLogsAnimated,
  };
}
