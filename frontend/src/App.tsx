import { useState } from "react";
import { motion } from "framer-motion";
import { DocumentUpload } from "./components/DocumentUpload";
import { ChatInterface } from "./components/ChatInterface";
import { GlassPanel } from "./components/GlassPanel";
import type { UploadResponse } from "./types";

export default function App() {
  const [uploadedDocs, setUploadedDocs] = useState<UploadResponse[]>([]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#020408] flex flex-col relative font-sans">

      {/* HUD Grid — fixed behind everything */}
      <div className="fixed inset-0 hud-grid opacity-100 pointer-events-none z-0" />

      {/* Ambient glow orbs */}
      <div className="fixed top-[-20%] left-[10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[5%] w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">

        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 glass-border rounded-lg">
              <div className="glass-inner rounded-lg w-full h-full flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                  <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="#3b82f6" strokeWidth="2" fill="rgba(59,130,246,0.15)" />
                  <circle cx="16" cy="16" r="3" fill="#3b82f6" />
                </svg>
              </div>
            </div>
            <h1 className="text-sm font-semibold tracking-tighter text-white">
              InsurAgent <span className="text-blue-400">AI</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span className="font-mono text-[10px] tracking-wide text-slate-500 uppercase">System Online</span>
            </div>
            <div className="font-mono text-[10px] text-slate-600 tracking-wide">
              v1.0.0
            </div>
          </div>
        </header>

        {/* Main layout */}
        <main className="flex flex-1 overflow-hidden gap-3 p-3">

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="w-64 flex-shrink-0"
          >
            <GlassPanel className="h-full">
              <div className="flex flex-col gap-5 p-4 h-full overflow-y-auto">

                {/* Upload section */}
                <div>
                  <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-slate-500 mb-3">
                    ◈ Policy Documents
                  </p>
                  <DocumentUpload onUploaded={(r) => setUploadedDocs((prev) => [...prev, r])} />
                </div>

                {/* Indexed docs */}
                {uploadedDocs.length > 0 && (
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-slate-500 mb-2">
                      ◈ Indexed
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {uploadedDocs.map((d, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between px-2 py-1.5 rounded glass-border"
                        >
                          <div className="glass-inner rounded px-2 py-1.5 w-full flex justify-between">
                            <span className="font-mono text-[10px] text-slate-300 truncate max-w-[120px]">{d.filename}</span>
                            <span className="font-mono text-[9px] text-slate-600">{d.chunks_indexed}c</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agent tools */}
                <div className="mt-auto">
                  <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-slate-500 mb-3">
                    ◈ Agent Tools
                  </p>
                  <div className="flex flex-col gap-2">
                    {[
                      { name: "search_policy", label: "RAG Retrieval", color: "blue" },
                      { name: "calculate_quote", label: "Python Math", color: "emerald" },
                    ].map((tool) => (
                      <div key={tool.name} className="flex items-center gap-2 px-2 py-2 rounded glass-border">
                        <div className="glass-inner rounded px-2 py-2 w-full flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse-dot ${
                            tool.color === "blue" ? "bg-blue-400" : "bg-emerald-400"
                          }`} />
                          <div className="min-w-0">
                            <p className={`font-mono text-[10px] truncate ${
                              tool.color === "blue" ? "text-blue-300" : "text-emerald-300"
                            }`}>{tool.name}</p>
                            <p className="font-mono text-[9px] text-slate-600">{tool.label}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </GlassPanel>
          </motion.aside>

          {/* Chat panel */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex-1 min-w-0"
          >
            <GlassPanel className="h-full">
              {/* HUD grid inside chat */}
              <div className="relative h-full rounded-xl overflow-hidden">
                <div className="absolute inset-0 hud-grid opacity-50 pointer-events-none" />
                <div className="relative h-full">
                  <ChatInterface />
                </div>
              </div>
            </GlassPanel>
          </motion.div>

        </main>
      </div>
    </div>
  );
}
