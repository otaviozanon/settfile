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

  const clearLogsAnimated = useCallback(async (delay: number = 30) => {
    // We need to work with the current logs at the moment of call
    setLogs((currentLogs) => {
      const copy = [...currentLogs];
      
      const removeOne = () => {
        if (copy.length === 0) return;
        
        copy.pop(); // Remove from bottom (oldest)
        setLogs([...copy]);
        
        if (copy.length > 0) {
          setTimeout(removeOne, delay);
        }
      };
      
      setTimeout(removeOne, delay);
      return currentLogs;
    });
  }, []);

  return {
    logs,
    addLog,
    clearLogs,
    clearLogsAnimated,
  };
}
