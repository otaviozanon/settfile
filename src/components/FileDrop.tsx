import React from "react";

interface Props {
  dragActive: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (file: File) => void;
  handleDrop: (e: React.DragEvent) => void;
}

export const FileDrop: React.FC<Props> = ({
  dragActive,
  fileInputRef,
  handleFileSelect,
  handleDrop,
}) => {
  return (
    <div
      className={`file-drop ${dragActive ? "active" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={handleDrop}
      title="Clique ou arraste o arquivo"
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
      <div>Arraste um arquivo aqui ou clique para escolher</div>
    </div>
  );
};
