import { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { sendMessage } from "../api";
import { CitationPanel } from "./CitationPanel";
import { SystemReady } from "./SystemReady";
import type { Message } from "../types";

const SESSION_ID = uuidv4();

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function submit() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: Message = {
      id: uuidv4(), role: "user", content: text, timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await sendMessage(SESSION_ID, text);
      setMessages((prev) => [...prev, {
        id: uuidv4(), role: "assistant", content: res.answer,
        citations: res.citations, toolCallsMade: res.tool_calls_made,
        timestamp: new Date(),
      }]);
    } catch (e: unknown) {
      setMessages((prev) => [...prev, {
        id: uuidv4(), role: "assistant",
        content: `Error: ${e instanceof Error ? e.message : "Unknown error"}`,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="flex flex-col h-full">

      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && !loading ? (
          <SystemReady />
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                {/* Role label */}
                <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-slate-600 mb-1 px-1">
                  {msg.role === "user" ? "You" : "InsurAgent"}
                </p>

                {/* Bubble */}
                {msg.role === "user" ? (
                  <div className="max-w-[70%] px-4 py-2.5 rounded-xl rounded-br-sm bg-blue-600/20 border border-blue-500/30 text-sm text-slate-200 leading-relaxed">
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[70%] glass-border rounded-xl rounded-bl-sm">
                    <div className="glass-inner rounded-xl rounded-bl-sm px-4 py-2.5 text-sm text-slate-200 leading-relaxed">
                      {msg.content}
                      {msg.toolCallsMade && msg.toolCallsMade.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/5">
                          {msg.toolCallsMade.map((t) => (
                            <span key={t} className="font-mono text-[9px] tracking-wide px-2 py-0.5 rounded-sm bg-blue-500/10 border border-blue-500/20 text-blue-400">
                              ⚙ {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {msg.citations && <CitationPanel citations={msg.citations} />}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-2"
          >
            <div className="glass-border rounded-xl rounded-bl-sm">
              <div className="glass-inner rounded-xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-blue-400"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="px-4 pb-4 pt-2">
        <div className="glass-border rounded-xl">
          <div className="glass-inner rounded-xl flex gap-2 p-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder="Query the policy or request a quote..."
              rows={2}
              disabled={loading}
              className="
                flex-1 bg-transparent resize-none text-sm text-slate-200
                placeholder:text-slate-600 placeholder:font-mono placeholder:text-xs
                focus:outline-none focus:shadow-glow-blue transition-shadow duration-300
                px-2 py-1 leading-relaxed
              "
            />
            <motion.button
              onClick={submit}
              disabled={loading || !input.trim()}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="
                self-end font-mono text-[10px] tracking-[0.15em] uppercase
                px-4 py-2 rounded-lg
                bg-blue-600/30 border border-blue-500/40 text-blue-300
                hover:bg-blue-600/50 hover:shadow-glow-blue
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all duration-200
              "
            >
              Send ↵
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
