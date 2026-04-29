# InsurAgent AI — Project Documentation

## What This Project Is

A RAG-powered agentic system for insurance agents. Agents upload carrier policy PDFs and chat with them to:
- Find coverage gaps and exclusions
- Generate quotes via deterministic Python calculations
- Automate claim eligibility checks

Built as a portfolio showcase demonstrating production-grade AI engineering patterns.

---

## Tech Stack

| Layer | Technology |
|---|---|
| PDF Parsing | PyMuPDF (`fitz`) |
| Chunking | LangChain `RecursiveCharacterTextSplitter` (parent-child) |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` (HuggingFace) |
| Vector Store | ChromaDB (local dev) / Pinecone (production via env swap) |
| Re-Ranker | `cross-encoder/ms-marco-MiniLM-L-6-v2` |
| Agent | LangGraph (stateful graph, tool-calling loop) |
| LLM | Claude (Anthropic) via `langchain-anthropic` |
| Backend API | FastAPI + Uvicorn |
| Frontend | React 18 + TypeScript + Vite |
| Containerization | Docker + Docker Compose |
| Deployment target | AWS ECS Fargate + ECR |
| Evaluation | RAGAS (5 metrics) |

---

## File Map

```
RAG-LLM-Project-showcase/
├── CLAUDE.md                        ← this file
├── ARCHITECTURE.md                  ← system diagram + design decisions
├── README.md                        ← quick start, RAG snippet, RAGAS guide
├── docker-compose.yml
├── .env.example
│
├── backend/
│   ├── requirements.txt
│   ├── Dockerfile
│   │
│   ├── ingestion/
│   │   ├── pdf_parser.py            ← PyMuPDF text + table extraction (tables → markdown)
│   │   └── chunker.py               ← Parent (512 tok) / Child (128 tok) split → ChunkPair
│   │
│   ├── vectorstore/
│   │   └── chroma_store.py          ← ChromaDB collection + JSON docstore for parent lookup
│   │
│   ├── retrieval/
│   │   ├── reranker.py              ← CrossEncoder.predict() → sort by score → top_k
│   │   └── retriever.py             ← Full chain: similarity_search → fetch_parents → rerank → citations
│   │
│   ├── agent/
│   │   ├── prompts.py               ← System prompt + tool description strings
│   │   ├── tools.py                 ← @tool search_policy (RAG) + @tool calculate_quote (Python math)
│   │   └── graph.py                 ← LangGraph: agent node ↔ tools node, should_continue routing
│   │
│   ├── api/
│   │   ├── main.py                  ← FastAPI app, CORS middleware, router registration
│   │   ├── models.py                ← Pydantic: ChatRequest, ChatResponse, Citation, UploadResponse
│   │   └── routes/
│   │       ├── upload.py            ← POST /api/upload  (PDF → parse → chunk → index)
│   │       ├── chat.py              ← POST /api/chat    (message → LangGraph → answer + citations)
│   │       └── health.py            ← GET  /api/health  (status + vector count)
│   │
│   └── evaluation/
│       └── ragas_eval.py            ← RAGAS runner: builds dataset, evaluates 5 metrics, writes JSON report
│
└── frontend/
    ├── Dockerfile                   ← multi-stage: node build → nginx serve
    ├── nginx.conf                   ← SPA fallback + /api proxy to backend
    ├── index.html
    ├── package.json                 ← React 18, TypeScript, Vite, uuid
    ├── tsconfig.json
    ├── vite.config.ts               ← dev proxy /api → localhost:8000
    └── src/
        ├── App.tsx                  ← root layout: sidebar (upload + doc list + tools) + chat area
        ├── App.css                  ← dark-mode design system (CSS custom properties)
        ├── api.ts                   ← typed fetch: uploadPolicy(), sendMessage(), checkHealth()
        ├── types.ts                 ← Citation, Message, ChatResponse, UploadResponse interfaces
        └── components/
            ├── DocumentUpload.tsx   ← drag-and-drop PDF upload, shows indexed chunk count
            ├── ChatInterface.tsx    ← message history, loading dots, tool badge display, send input
            └── CitationPanel.tsx    ← per-message panel: source file | page | type | score | snippet
```

---

## Key Architectural Patterns

### Parent-Child Retrieval
Child chunks (128 tokens) are embedded for precise vector search. When retrieved, they resolve to their parent chunk (512 tokens) which is what the LLM reads. This balances retrieval precision with sufficient context for complex policy clauses.

### Cross-Encoder Re-Ranking
After ChromaDB returns top-20 child chunks (bi-encoder similarity), a cross-encoder scores each query+parent pair together. This catches semantic failures like negation ("does NOT cover flood damage") that cosine similarity misses. Only top-5 survive to the LLM.

### LangGraph Tool Routing
The agent node calls the LLM with both tools bound. `should_continue()` checks for `tool_calls` on the last message — if present, routes to the tools node; otherwise ends. This loop handles multi-step queries (e.g., "find the flood clause, then quote me a policy with it").

### Deterministic Quote Calculation
All arithmetic runs in the `calculate_quote` Python tool — never by the LLM. Formula: `annual_premium = base_rate × coverage_amount × risk_factor`. The LLM receives the JSON result and formats it for the user.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload PDF → parse → chunk → index into ChromaDB |
| `POST` | `/api/chat` | Send message → LangGraph agent → answer + citations |
| `GET` | `/api/health` | Returns `{status, vector_count}` |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Required. Claude API key |
| `CLAUDE_MODEL` | `claude-sonnet-4-6` | Model ID |
| `CHROMA_PERSIST_DIR` | `./data/chroma` | ChromaDB persistence path |
| `DOCSTORE_PATH` | `./data/docstore.json` | Parent chunk docstore path |

---

## Running Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev        # http://localhost:3000

# Or everything via Docker
docker-compose up --build
```

## Running RAGAS Evaluation

```bash
cd backend
python -m evaluation.ragas_eval
# Output: ./data/ragas_report.json
```

Metrics: `faithfulness`, `answer_relevancy`, `context_precision`, `context_recall`, `answer_correctness`.

---

## To Extend This Project

- **Add Pinecone**: set `VECTOR_STORE_BACKEND=pinecone` + `PINECONE_API_KEY` in `.env`. Update `chroma_store.py` to branch on this env var.
- **Add a new agent tool**: define a `@tool` function in `agent/tools.py`, append it to `TOOLS`, re-run.
- **Improve retrieval**: tune `child_k` and `final_k` in `retriever.py` based on RAGAS `context_precision` / `context_recall` scores.
- **Production sessions**: replace the in-memory `_sessions` dict in `chat.py` with Redis.
- **AWS deploy**: build + push Docker images to ECR, deploy via ECS Fargate task definitions, mount EFS for ChromaDB volume.
