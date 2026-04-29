import { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { sendMessage } from "../api";
import { CitationPanel } from "./CitationPanel";
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
      id: uuidv4(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await sendMessage(SESSION_ID, text);
      const aiMsg: Message = {
        id: uuidv4(),
        role: "assistant",
        content: res.answer,
        citations: res.citations,
        toolCallsMade: res.tool_calls_made,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: unknown) {
      const errMsg: Message = {
        id: uuidv4(),
        role: "assistant",
        content: `Error: ${e instanceof Error ? e.message : "Unknown error"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="chat-container">
      <div className="message-list">
        {messages.map((msg) => (
          <div key={msg.id} className={`message message--${msg.role}`}>
            <div className="message-bubble">
              <p className="message-text">{msg.content}</p>
              {msg.toolCallsMade && msg.toolCallsMade.length > 0 && (
                <div className="tool-badges">
                  {msg.toolCallsMade.map((t) => (
                    <span key={t} className="tool-badge">{t}</span>
                  ))}
                </div>
              )}
            </div>
            {msg.citations && <CitationPanel citations={msg.citations} />}
          </div>
        ))}
        {loading && (
          <div className="message message--assistant">
            <div className="message-bubble message-bubble--loading">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask about coverage, exclusions, or request a quote..."
          rows={2}
          disabled={loading}
        />
        <button className="send-btn" onClick={submit} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
