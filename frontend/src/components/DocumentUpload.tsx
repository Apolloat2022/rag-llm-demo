import { useRef, useState } from "react";
import { motion } from "framer-motion";
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
  const [dragging, setDragging] = useState(false);

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
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div
      className="relative"
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* HUD Upload Button */}
      <motion.button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          w-full relative font-mono text-[11px] tracking-[0.15em] uppercase
          px-4 py-3 rounded-sm
          border border-blue-500/40
          bg-blue-500/10
          text-blue-300
          transition-all duration-200
          hover:bg-blue-500/20 hover:border-blue-400/60 hover:shadow-glow-blue
          disabled:opacity-40 disabled:cursor-not-allowed
          ${dragging ? 'border-blue-400 bg-blue-500/20 shadow-glow-blue' : ''}
        `}
      >
        <span className="mr-2 opacity-60">▲</span>
        {loading ? "Indexing..." : "Upload Policy PDF"}
      </motion.button>

      <p className="mt-1.5 text-center font-mono text-[9px] tracking-widest text-slate-600 uppercase">
        or drop file here
      </p>

      {error && (
        <p className="mt-2 font-mono text-[10px] text-red-400/80">{error}</p>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 px-3 py-2 rounded glass-border"
        >
          <div className="glass-inner rounded px-3 py-2">
            <p className="font-mono text-[10px] text-emerald-400 truncate">{result.filename}</p>
            <p className="font-mono text-[9px] text-slate-500">{result.chunks_indexed} chunks indexed</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
