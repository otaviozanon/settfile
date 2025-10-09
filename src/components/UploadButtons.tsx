import React from "react";

interface Props {
  uploading: boolean;
  selectedFile: File | null;
  handleUpload: () => void;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
  setUploading: React.Dispatch<React.SetStateAction<boolean>>;
  setStatusText: React.Dispatch<React.SetStateAction<string>>;
  addLog: (msg: string) => void;
  currentAttempt: string;
  clearUpload: () => void;
  uploadResult: { url: string; expire: string } | null;
}

export const UploadButtons: React.FC<Props> = ({
  uploading,
  selectedFile,
  handleUpload,
  abortControllerRef,
  setUploading,
  setStatusText,
  addLog,
  currentAttempt,
  clearUpload,
  uploadResult,
}) => {
  return (
    <div className="upload-buttons">
      <button
        className="cs-btn"
        onClick={handleUpload}
        disabled={uploading || !selectedFile}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      <button
        className="cs-btn cancel-btn"
        onClick={() => {
          if (uploadResult) {
            clearUpload();
          } else if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setUploading(false);
            setStatusText("Upload canceled.");
            addLog("Upload canceled by user.");
          }
        }}
        disabled={!uploading && !uploadResult}
      >
        {uploadResult ? "Clear" : "Cancel"}
      </button>
      <div className="attempt-info">
        Attempt: <span>{currentAttempt}</span>
      </div>
    </div>
  );
};
