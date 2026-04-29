import { motion } from "framer-motion";

export function SystemReady() {
  return (
    <div className="flex flex-col items-center justify-center h-full select-none overflow-hidden relative">

      {/* Scanning line */}
      <motion.div
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent pointer-events-none"
        initial={{ top: "0%" }}
        animate={{ top: "100%" }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
      />

      {/* Logo mark */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl glass-border">
          <div className="glass-inner rounded-2xl w-full h-full flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4L28 10V22L16 28L4 22V10L16 4Z" stroke="rgba(59,130,246,0.8)" strokeWidth="1.5" fill="rgba(59,130,246,0.08)" />
              <path d="M16 10L22 13V19L16 22L10 19V13L16 10Z" stroke="rgba(59,130,246,0.5)" strokeWidth="1" fill="rgba(59,130,246,0.05)" />
              <circle cx="16" cy="16" r="2" fill="#3b82f6" />
            </svg>
          </div>
        </div>
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-2xl border border-blue-500/30"
          animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
      </div>

      <p className="font-mono text-xs tracking-[0.3em] text-blue-400/70 uppercase mb-2">
        InsurAgent AI
      </p>
      <p className="font-mono text-[10px] tracking-[0.2em] text-slate-500 uppercase">
        System Ready — Upload a policy to begin
      </p>

      {/* Corner brackets */}
      <div className="absolute top-8 left-8 w-5 h-5 border-t border-l border-white/10" />
      <div className="absolute top-8 right-8 w-5 h-5 border-t border-r border-white/10" />
      <div className="absolute bottom-8 left-8 w-5 h-5 border-b border-l border-white/10" />
      <div className="absolute bottom-8 right-8 w-5 h-5 border-b border-r border-white/10" />
    </div>
  );
}
