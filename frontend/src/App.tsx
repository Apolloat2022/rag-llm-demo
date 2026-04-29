import { useState } from "react";
import { DocumentUpload } from "./components/DocumentUpload";
import { ChatInterface } from "./components/ChatInterface";
import type { UploadResponse } from "./types";
import "./App.css";

export default function App() {
  const [uploadedDocs, setUploadedDocs] = useState<UploadResponse[]>([]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">InsurAgent AI</h1>
        <p className="app-subtitle">RAG-powered insurance policy analysis with source citations</p>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <section className="sidebar-section">
            <h3>Upload Policy</h3>
            <DocumentUpload onUploaded={(r) => setUploadedDocs((prev) => [...prev, r])} />
          </section>

          {uploadedDocs.length > 0 && (
            <section className="sidebar-section">
              <h3>Indexed Documents</h3>
              <ul className="doc-list">
                {uploadedDocs.map((d, i) => (
                  <li key={i} className="doc-item">
                    <span className="doc-name">{d.filename}</span>
                    <span className="doc-chunks">{d.chunks_indexed} chunks</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="sidebar-section">
            <h3>Agent Tools</h3>
            <ul className="tool-list">
              <li><span className="tool-pill tool-pill--rag">search_policy</span> RAG retrieval</li>
              <li><span className="tool-pill tool-pill--calc">calculate_quote</span> Python math</li>
            </ul>
          </section>
        </aside>

        <div className="chat-wrapper">
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}
