import { useRef, useState } from "react";
import { uploadPolicy } from "../api";
import type { UploadResponse } from "../types";

interface Props {
  onUploaded: (result: UploadResponse) => void;
}

export function DocumentUpload({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const res = await uploadPolicy(file);
      setResult(res);
      onUploaded(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="upload-area" onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button
        className="upload-btn"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload Policy PDF"}
      </button>
      <p className="upload-hint">or drag & drop a PDF here</p>

      {error && <p className="error">{error}</p>}
      {result && (
        <div className="upload-success">
          <strong>{result.filename}</strong> — {result.chunks_indexed} chunks indexed
        </div>
      )}
    </div>
  );
}
