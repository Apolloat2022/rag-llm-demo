import { motion } from "framer-motion";
import type { Citation } from "../types";

interface Props {
  citations: Citation[];
}

export function CitationPanel({ citations }: Props) {
  if (citations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 glass-border rounded-lg max-w-[72%]"
    >
      <div className="glass-inner rounded-lg px-3 py-2">
        <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-slate-500 mb-2">
          ◈ Source Citations
        </p>
        <div className="flex flex-col gap-2">
          {citations.map((c, i) => (
            <div key={i} className="border-l border-blue-500/20 pl-2">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm ${
                  c.block_type === "table"
                    ? "bg-violet-500/15 text-violet-400"
                    : "bg-blue-500/15 text-blue-400"
                }`}>
                  {c.block_type.toUpperCase()}
                </span>
                <span className="font-mono text-[10px] text-blue-300/80 truncate max-w-[140px]">
                  {c.source}
                </span>
                <span className="font-mono text-[9px] text-slate-500">p.{c.page}</span>
                <span className="font-mono text-[9px] text-emerald-400/80 ml-auto">
                  {(c.rerank_score * 100).toFixed(0)}%
                </span>
              </div>
              <p className="font-mono text-[9px] text-slate-500 leading-relaxed line-clamp-2 italic">
                "{c.snippet}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
