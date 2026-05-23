import React, { useState, useMemo, useCallback } from "react";
import { PROVIDERS } from "./providers";
import { FileDrop } from "./components/FileDrop";
import { UploadButtons } from "./components/UploadButtons";
import { ProgressBar } from "./components/ProgressBar";
import { LogPanel } from "./components/LogPanel";
import { ProvidersTable } from "./components/ProvidersTable";
import { Pagination } from "./components/Pagination";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useFileUpload } from "./hooks/useFileUpload";
import { useLogger } from "./hooks/useLogger";
import type { LogEntry } from "./hooks/useLogger";
import { formatFileSize } from "./utils/validation";
import "./App.css";
import { Download } from "lucide-react";

function App() {
  const [currentPage, setCurrentPage] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const itemsPerPage = 6; // Show 6 providers per page (11 total = 2 pages)

  // Use custom hooks for cleaner state management
  const { logs, addLog, clearLogsAnimated } = useLogger({ maxLogs: 50 });

  const {
    state: uploadState,
    selectFile,
    setSelectedProviderId,
    upload,
    cancelUpload,
    clearUpload,
    retryWithAnotherProvider,
    abortControllerRef,
  } = useFileUpload({
    onLog: (message, level) => addLog(message, level as LogEntry["level"] || "info"),
    onSuccess: (result) => {
      addLog(`Upload successful: ${result.url}`, "success");
    },
    onError: (error) => {
      addLog(`Upload error: ${error.message}`, "error");
    },
  });

  const selectedProviderName = useMemo(() => {
    if (!uploadState.selectedProviderId) return "Auto (Recommended)";
    return (
      PROVIDERS.find((p) => p.id === uploadState.selectedProviderId)?.name ||
      "Unknown"
    );
  }, [uploadState.selectedProviderId]);

  // Memoize file info to prevent unnecessary re-renders
  const fileInfo = useMemo(() => {
    if (!uploadState.selectedFile) return null;

    return {
      name: uploadState.selectedFile.name,
      size: formatFileSize(uploadState.selectedFile.size),
      type: uploadState.selectedFile.type || "unknown",
      extension:
        uploadState.selectedFile.name.split(".").pop()?.toUpperCase() || "N/A",
    };
  }, [uploadState.selectedFile]);

  // Memoize handlers to prevent re-creation on every render
  const handleFileSelect = useCallback(
    (file: File) => {
      selectFile(file);
    },
    [selectFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  // Memoize paginated providers
  const paginatedProviders = useMemo(() => {
    return PROVIDERS.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(PROVIDERS.length / itemsPerPage);
  }, [itemsPerPage]);

  return (
    <ErrorBoundary>
      <div className="app-container">
        <h1>settfile - smart uploader</h1>

        <FileDrop
          dragActive={dragActive}
          handleFileSelect={handleFileSelect}
          handleDrop={handleDrop}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
        />

        {fileInfo && (
          <div className="file-info">
            <span>Name: {fileInfo.name}</span>
            <span>Size: {fileInfo.size}</span>
            <span>Type: {fileInfo.type}</span>
            <span>Extension: {fileInfo.extension}</span>
          </div>
        )}

        <UploadButtons
          uploading={uploadState.uploading}
          selectedFile={uploadState.selectedFile}
          handleUpload={upload}
          abortControllerRef={abortControllerRef}
          handleCancel={cancelUpload}
          currentAttempt={uploadState.currentAttempt}
          clearUpload={clearUpload}
          uploadResult={uploadState.uploadResult}
          handleUploadAnotherHost={retryWithAnotherProvider}
        />

        <ProgressBar progress={uploadState.progress} />
        <div className="status-text">{uploadState.statusText}</div>

        {uploadState.uploadResult && (
          <div className="download-link">
            <a
              href={uploadState.uploadResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="download-button"
            >
              <Download size={16} style={{ marginRight: "6px" }} />
              Download
              <span className="expire-text">
                (expires: {uploadState.uploadResult.expire})
              </span>
            </a>
          </div>
        )}

        <LogPanel logs={logs} onClear={clearLogsAnimated} />

        <div className="selected-host-info">
          Target Host: <strong>{selectedProviderName}</strong>
        </div>

        <ProvidersTable
          providers={paginatedProviders}
          selectedProviderId={uploadState.selectedProviderId}
          onSelectProvider={setSelectedProviderId}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
