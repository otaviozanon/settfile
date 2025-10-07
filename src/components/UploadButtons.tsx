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
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setUploading(false);
            setStatusText("Upload canceled.");
            addLog("Upload canceled by user.");
          }
        }}
        disabled={!uploading}
      >
        Cancel
      </button>
      <div className="attempt-info">
        Attempt: <span>{currentAttempt}</span>
      </div>
    </div>
  );
};
