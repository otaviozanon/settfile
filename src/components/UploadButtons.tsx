import React from "react";
import { UploadResult } from "../hooks/useFileUpload";

interface Props {
  uploading: boolean;
  selectedFile: File | null;
  handleUpload: () => void;
  abortControllerRef: React.MutableRefObject<AbortController | null>;
  handleCancel: () => void;
  currentAttempt: string;
  clearUpload: () => void;
  uploadResult: UploadResult | null;
  handleUploadAnotherHost?: () => void;
}

export const UploadButtons = React.memo<Props>(
  ({
    uploading,
    selectedFile,
    handleUpload,
    handleCancel,
    currentAttempt,
    clearUpload,
    uploadResult,
    handleUploadAnotherHost,
  }) => {

  const handleCancelClick = () => {
      if (uploadResult) {
        clearUpload();
      } else {
        handleCancel();
      }
    };

    return (
      <div className="upload-buttons">
        <button
          className="cs-btn"
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          aria-label="Upload file"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>

        <button
          className="cs-btn cancel-btn"
          onClick={handleCancelClick}
          disabled={!uploading && !uploadResult}
          aria-label={uploadResult ? "Clear upload" : "Cancel upload"}
        >
          {uploadResult ? "Clear" : "Cancel"}
        </button>

        {uploadResult && handleUploadAnotherHost && (
          <button
            className="cs-btn alt-host-btn"
            onClick={handleUploadAnotherHost}
            disabled={uploading}
            aria-label="Try another provider"
          >
            Swap Host
          </button>
        )}

        <div className="attempt-info">
          Attempt: <span>{currentAttempt}</span>
        </div>
      </div>
    );
  },
);
