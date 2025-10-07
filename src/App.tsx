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
  const [statusText, setStatusText] = useState("Pronto.");
  const [currentAttempt, setCurrentAttempt] = useState("-");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const itemsPerPage = 5;

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024)
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const tryUpload = async (
    provider: (typeof PROVIDERS)[0],
    file: File,
    signal: AbortSignal
  ) => {
    if (!provider.upload) throw new Error("Provedor não implementado");
    return provider.upload(file, signal);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadResult(null);
    setProgress(0);
    setStatusText("Arquivo selecionado.");
    setCurrentAttempt("-");
    addLog(`Arquivo selecionado: ${file.name} (${formatFileSize(file.size)})`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const uploadWithProgress = async (
    file: File,
    provider: (typeof PROVIDERS)[0],
    signal: AbortSignal,
    onProgress: (p: number) => void
  ): Promise<string> => {
    if (!provider.upload) throw new Error("Provedor não implementado");

    onProgress(0); // inicia a barra
    try {
      // Chama o upload do provider
      const url = await provider.upload(file, signal);
      onProgress(100); // completa a barra
      return url;
    } catch (err) {
      onProgress(0); // reset caso falhe
      throw err;
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setUploadResult(null);
    abortControllerRef.current = new AbortController();

    const fileSizeMB = selectedFile.size / (1024 * 1024);

    // Ordena do provedor que aceita menos MB para o que aceita mais
    const compatibleProviders = PROVIDERS.filter(
      (p) => p.maxMB >= fileSizeMB
    ).sort((a, b) => a.maxMB - b.maxMB);

    addLog(`Iniciando upload de ${selectedFile.name}...`);
    setStatusText("Enviando arquivo...");

    let attemptCount = 0;

    for (const provider of compatibleProviders) {
      if (abortControllerRef.current?.signal.aborted) break;

      attemptCount++;
      setCurrentAttempt(`${attemptCount}/${compatibleProviders.length}`);
      addLog(`Tentando enviar para ${provider.name}...`);

      try {
        if (!provider.upload) {
          addLog(`✗ Provedor ${provider.name} não implementa upload`);
          continue;
        }

        // Chama o upload do provider com AbortSignal e callback de progresso
        const url = await provider.upload(
          selectedFile,
          abortControllerRef.current.signal,
          setProgress
        );

        addLog(`✓ Upload concluído em ${provider.name}`);
        setUploadResult({ url, expire: provider.expire });
        setStatusText(`Sucesso! Arquivo enviado para ${provider.name}`);
        setUploading(false);
        setProgress(100);
        return; // Para no primeiro upload bem-sucedido
      } catch (err) {
        addLog(`✗ Falha em ${provider.name}: ${(err as Error).message}`);
        setProgress(0); // Reseta barra ao falhar
      }
    }

    // Caso todos os provedores falhem
    setStatusText("Erro: todos os provedores falharam.");
    addLog("Todos os provedores falharam.");
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
          <span>Nome: {selectedFile.name}</span>
          <span>Tamanho: {formatFileSize(selectedFile.size)}</span>
          <span>Tipo: {selectedFile.type || "desconhecido"}</span>
          <span>
            Extensão:{" "}
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

      <LogPanel logs={logs} onClear={() => setLogs([])} />

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
