import React, { useRef } from "react";

interface Props {
  dragActive: boolean;
  handleFileSelect: (file: File) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
}

export const FileDrop = React.memo<Props>(
  ({
    dragActive,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragLeave,
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
      <div
        className={`file-drop ${dragActive ? "active" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        title="Click or drag a file"
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
          }}
          onChange={(e) =>
            e.target.files?.[0] && handleFileSelect(e.target.files[0])
          }
        />
        <div>Drag a file here or click to select</div>
      </div>
    );
  },
);
