import { useRef, useState } from "react";
import type { DragEvent } from "react";

interface FileDropzoneProps {
  label: string;
  hint?: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileDropzone({ label, hint, file, onChange }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const acceptFile = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith(".pdf")) return;
    onChange(candidate);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    acceptFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="dropzone-field">
      <span className="dropzone-label">{label}</span>
      <div
        className={`dropzone${isDragOver ? " dropzone--active" : ""}${file ? " dropzone--filled" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          hidden
          onChange={(e) => acceptFile(e.target.files?.[0])}
        />
        {file ? (
          <div className="dropzone-file">
            <span className="dropzone-file-name">{file.name}</span>
            <span className="dropzone-file-size">{formatBytes(file.size)}</span>
            <button
              type="button"
              className="dropzone-clear"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <span className="dropzone-icon" aria-hidden>
              ⬆
            </span>
            <span>Drop PDF here or click to browse</span>
            {hint && <span className="dropzone-hint">{hint}</span>}
          </>
        )}
      </div>
    </div>
  );
}
