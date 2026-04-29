import { useState } from "react";
import { motion } from "framer-motion";
import { DocumentUpload } from "./components/DocumentUpload";
import { ChatInterface } from "./components/ChatInterface";
import { GlassPanel } from "./components/GlassPanel";
import type { UploadResponse } from "./types";

export default function App() {
  const [uploadedDocs, setUploadedDocs] = useState<UploadResponse[]>([]);
  const [dark, setDark] = useState(false);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="h-screen w-screen overflow-hidden flex flex-col relative font-sans bg-[#f0f4ff] dark:bg-[#020408] text-slate-900 dark:text-slate-100 transition-colors duration-300">

        {/* HUD Grid */}
        <div className="fixed inset-0 hud-grid pointer-events-none z-0" />

        {/* Ambient orbs — different per theme */}
        <div className="fixed top-[-20%] left-[10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none z-0 bg-blue-400/10 dark:bg-blue-600/5" />
        <div className="fixed bottom-[-20%] right-[5%] w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none z-0 bg-violet-400/10 dark:bg-violet-600/5" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">

          {/* Header */}
          <header className="flex items-center justify-between px-6 py-3" style={{ borderBottom: '1px solid var(--header-border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 glass-border rounded-lg">
                <div className="glass-inner rounded-lg w-full h-full flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                    <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="#3b82f6" strokeWidth="2" fill="rgba(59,130,246,0.15)" />
                    <circle cx="16" cy="16" r="3" fill="#3b82f6" />
                  </svg>
                </div>
              </div>
              <h1 className="text-sm font-semibold tracking-tighter text-slate-900 dark:text-white">
                InsurAgent <span className="text-blue-500">AI</span>
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                <span className="font-mono text-[10px] tracking-wide text-slate-400 dark:text-slate-500 uppercase">System Online</span>
              </div>

              {/* Theme toggle */}
              <motion.button
                onClick={() => setDark(!dark)}
                whileTap={{ scale: 0.92 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-border transition-all duration-200 hover:opacity-80"
                title={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                <div className="glass-inner rounded-full px-3 py-1.5 flex items-center gap-1.5">
                  <span className="text-[13px]">{dark ? "☀️" : "🌙"}</span>
                  <span className="font-mono text-[10px] tracking-wide text-slate-500 dark:text-slate-400 uppercase">
                    {dark ? "Light" : "Dark"}
                  </span>
                </div>
              </motion.button>

              <span className="font-mono text-[10px] text-slate-400 dark:text-slate-600 tracking-wide">v1.0.0</span>
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

                  <div>
                    <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-slate-400 dark:text-slate-500 mb-3">
                      ◈ Policy Documents
                    </p>
                    <DocumentUpload onUploaded={(r) => setUploadedDocs((prev) => [...prev, r])} />
                  </div>

                  {uploadedDocs.length > 0 && (
                    <div>
                      <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-slate-400 dark:text-slate-500 mb-2">
                        ◈ Indexed
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {uploadedDocs.map((d, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass-border rounded"
                          >
                            <div className="glass-inner rounded px-2 py-1.5 flex justify-between">
                              <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{d.filename}</span>
                              <span className="font-mono text-[9px] text-slate-400 dark:text-slate-600">{d.chunks_indexed}c</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto">
                    <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-slate-400 dark:text-slate-500 mb-3">
                      ◈ Agent Tools
                    </p>
                    <div className="flex flex-col gap-2">
                      {[
                        { name: "search_policy", label: "RAG Retrieval", dot: "bg-blue-500" },
                        { name: "calculate_quote", label: "Python Math", dot: "bg-emerald-500" },
                      ].map((tool) => (
                        <div key={tool.name} className="glass-border rounded">
                          <div className="glass-inner rounded px-2 py-2 flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse-dot ${tool.dot}`} />
                            <div className="min-w-0">
                              <p className="font-mono text-[10px] text-blue-600 dark:text-blue-300 truncate">{tool.name}</p>
                              <p className="font-mono text-[9px] text-slate-400 dark:text-slate-600">{tool.label}</p>
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
                <div className="relative h-full rounded-xl overflow-hidden">
                  <div className="absolute inset-0 hud-grid opacity-60 pointer-events-none" />
                  <div className="relative h-full">
                    <ChatInterface dark={dark} />
                  </div>
                </div>
              </GlassPanel>
            </motion.div>

          </main>
        </div>
      </div>
    </div>
  );
}
