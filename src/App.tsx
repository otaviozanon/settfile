import React, { useState, useRef } from "react";
import { PROVIDERS } from "./providers";
import { FileDrop } from "./components/FileDrop";
import { UploadButtons } from "./components/UploadButtons";
import { ProgressBar } from "./components/ProgressBar";
import { LogPanel } from "./components/LogPanel";
import { ProvidersTable } from "./components/ProvidersTable";
import { Pagination } from "./components/Pagination";
import "./App.css";
import { Download } from "lucide-react";

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    url: string;
    expire: string;
  } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const [statusText, setStatusText] = useState("Ready.");
  const [currentAttempt, setCurrentAttempt] = useState("-");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const itemsPerPage = 5;

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  const clearUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setProgress(0);
    setCurrentAttempt("-");
    setStatusText("Ready.");
    addLog("Upload cleared.");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadResult(null);
    setProgress(0);
    setStatusText("File selected.");
    setCurrentAttempt("-");
    addLog(`File selected: ${file.name} (${formatFileSize(file.size)})`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setUploadResult(null);
    abortControllerRef.current = new AbortController();

    const fileSizeMB = selectedFile.size / (1024 * 1024);
    const compatibleProviders = PROVIDERS.filter(
      (p) => p.maxMB >= fileSizeMB
    ).sort((a, b) => a.maxMB - b.maxMB);

    addLog(`Starting upload: ${selectedFile.name}...`);
    setStatusText("Uploading file...");

    let attemptCount = 0;

    for (const provider of compatibleProviders) {
      if (abortControllerRef.current?.signal.aborted) break;

      attemptCount++;
      setCurrentAttempt(`${attemptCount}/${compatibleProviders.length}`);
      addLog(`Trying provider: ${provider.name}...`);

      try {
        if (!provider.upload) {
          addLog(`✗ Provider ${provider.name} not implemented`);
          continue;
        }

        const url = await provider.upload(
          selectedFile,
          abortControllerRef.current.signal,
          setProgress
        );

        addLog(`✓ Upload completed on ${provider.name}`);
        setUploadResult({ url, expire: provider.expire });
        setStatusText(`Success! File uploaded to ${provider.name}`);
        setUploading(false);
        setProgress(100);
        return;
      } catch (err) {
        addLog(`✗ Failed on ${provider.name}: ${(err as Error).message}`);
        setProgress(0);
      }
    }

    setStatusText("Error: all providers failed.");
    addLog("All providers failed.");
    setUploading(false);
    setCurrentAttempt("-");
  };

  const paginatedProviders = PROVIDERS.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(PROVIDERS.length / itemsPerPage);

  return (
    <div className="app-container">
      <h1>settfile - smart uploader</h1>

      <FileDrop
        dragActive={dragActive}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        handleDrop={handleDrop}
      />

      {selectedFile && (
        <div className="file-info">
          <span>Name: {selectedFile.name}</span>
          <span>Size: {formatFileSize(selectedFile.size)}</span>
          <span>Type: {selectedFile.type || "unknown"}</span>
          <span>
            Extension:{" "}
            {selectedFile.name.split(".").pop()?.toUpperCase() || "N/A"}
          </span>
        </div>
      )}

      <UploadButtons
        uploading={uploading}
        selectedFile={selectedFile}
        handleUpload={handleUpload}
        abortControllerRef={abortControllerRef}
        setUploading={setUploading}
        setStatusText={setStatusText}
        addLog={addLog}
        currentAttempt={currentAttempt}
        clearUpload={clearUpload}
        uploadResult={uploadResult}
      />

      <ProgressBar progress={progress} />
      <div className="status-text">{statusText}</div>

      {uploadResult && (
        <div className="download-link">
          <a
            href={uploadResult.url}
            target="_blank"
            rel="noopener noreferrer"
            className="download-button"
          >
            <Download size={16} style={{ marginRight: "6px" }} />
            Download
            <span className="expire-text">
              (expires: {uploadResult.expire})
            </span>
          </a>
        </div>
      )}

      <LogPanel logs={logs} onClear={() => setLogs([])} setLogs={setLogs} />

      <ProvidersTable providers={paginatedProviders} />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />
    </div>
  );
}

export default App;
