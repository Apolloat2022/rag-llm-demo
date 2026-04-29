# InsurAgent AI

A production-grade RAG-powered agentic system that lets insurance agents chat with carrier policy PDFs to find coverage gaps, generate quotes, and automate claim eligibility checks.

---

## Project Folder Structure

```
RAG-LLM-Project-showcase/
├── ARCHITECTURE.md              ← System architecture diagram & design decisions
├── docker-compose.yml           ← One-command local run
├── .env.example                 ← Environment variable template
│
├── backend/
│   ├── requirements.txt
│   ├── Dockerfile
│   │
│   ├── ingestion/
│   │   ├── pdf_parser.py        ← PyMuPDF: extracts text blocks + tables (→ markdown)
│   │   └── chunker.py           ← Parent-Child chunking (512 / 128 token split)
│   │
│   ├── vectorstore/
│   │   └── chroma_store.py      ← ChromaDB + JSON docstore for parent retrieval
│   │
│   ├── retrieval/
│   │   ├── reranker.py          ← Cross-Encoder re-ranker (ms-marco-MiniLM)
│   │   └── retriever.py         ← Full RAG chain: embed → fetch → re-rank → cite
│   │
│   ├── agent/
│   │   ├── prompts.py           ← System prompt + tool descriptions
│   │   ├── tools.py             ← search_policy (RAG) + calculate_quote (Python)
│   │   └── graph.py             ← LangGraph agent (agent node ↔ tools node)
│   │
│   ├── api/
│   │   ├── main.py              ← FastAPI app + CORS
│   │   ├── models.py            ← Pydantic request/response schemas
│   │   └── routes/
│   │       ├── upload.py        ← POST /api/upload
│   │       ├── chat.py          ← POST /api/chat
│   │       └── health.py        ← GET  /api/health
│   │
│   └── evaluation/
│       └── ragas_eval.py        ← RAGAS metrics runner + guide
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx              ← Root layout: sidebar + chat
        ├── App.css              ← Dark-mode design system
        ├── api.ts               ← Typed fetch wrappers
        ├── types.ts             ← Shared TypeScript interfaces
        └── components/
            ├── DocumentUpload.tsx   ← Drag-and-drop PDF upload
            ├── ChatInterface.tsx    ← Chat history + send input
            └── CitationPanel.tsx    ← Source: file | page | type | score | snippet
```

---

## RAG Retrieval Chain with Re-Ranker

This is the core Python snippet (`backend/retrieval/retriever.py + reranker.py`) showing the full pipeline:

```python
# ── Step 1: Embed query → ChromaDB top-20 CHILD chunks ──────────────────────
child_hits = chroma_store.similarity_search(query, k=20)

# ── Step 2: Resolve child → PARENT chunks (richer context for LLM) ──────────
# Child chunks (128 tokens) are indexed for precision.
# Parent chunks (512 tokens) are what the LLM actually reads.
parents = chroma_store.fetch_parents_for_children(child_hits)

# ── Step 3: Cross-Encoder Re-Rank ───────────────────────────────────────────
# The bi-encoder (cosine similarity) retrieves broadly.
# The cross-encoder reads BOTH query+doc together → precise relevance score.
from sentence_transformers import CrossEncoder

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2", max_length=512)
pairs = [(query, doc.page_content) for doc in parents]
scores = reranker.predict(pairs)

# ── Step 4: Return top-5, attach scores as citation metadata ─────────────────
reranked = sorted(zip(scores, parents), reverse=True)[:5]
for score, doc in reranked:
    doc.metadata["rerank_score"] = round(float(score), 4)

# Result → LangGraph agent → LLM answer + citation list → React UI
```

**Why this matters for insurance:** Policy clauses like "does NOT cover flood damage" and "DOES cover flood damage as an add-on" have similar embeddings but opposite meaning. The cross-encoder catches negation; cosine similarity does not.

---

## RAGAS Evaluation Guide

RAGAS measures five dimensions of RAG quality. Run with:

```bash
cd backend
python -m evaluation.ragas_eval
```

### The Five Metrics

| Metric | What it measures | Target |
|---|---|---|
| **faithfulness** | Is every claim in the answer grounded in the retrieved context? (Hallucination detector) | > 0.90 |
| **answer_relevancy** | Does the answer actually address the question? | > 0.85 |
| **context_precision** | Of the retrieved chunks, how many are actually useful? (Retrieval noise check) | > 0.80 |
| **context_recall** | Did retrieval find ALL relevant info from ground truth? (Coverage check) | > 0.75 |
| **answer_correctness** | End-to-end: does the answer match the human-written ground truth? | > 0.80 |

### Interpreting Results

```
=== RAGAS Evaluation Results ===
  faithfulness              0.94  ████████████████████
  answer_relevancy          0.89  █████████████████░░░
  context_precision         0.76  ███████████████░░░░░   ← re-rank k too high?
  context_recall            0.71  ██████████████░░░░░░   ← parent chunk too small?
  answer_correctness        0.83  █████████████████░░░
```

**Low context_precision** → reduce `final_k` in `retrieve()` or tighten the re-ranker threshold.  
**Low context_recall** → increase `child_k` (wider net) or increase parent chunk size.  
**Low faithfulness** → strengthen the system prompt ("only use retrieved text, never add outside knowledge").

### Building Your Eval Set

For insurance, annotate 50–100 Q&A pairs with domain experts:

```json
[
  {
    "question": "What is the deductible for water damage claims?",
    "ground_truth": "The standard deductible for water damage is $2,500 per occurrence per Section 4.2."
  },
  {
    "question": "Are acts of God excluded from liability?",
    "ground_truth": "Acts of God are excluded unless the Enhanced Natural Disaster rider is attached (Endorsement E-7)."
  }
]
```

Load in `ragas_eval.py` → `EVAL_QUESTIONS` list → run → get scores → iterate.

---

## Quick Start

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env → set ANTHROPIC_API_KEY

# 2. Run with Docker
docker-compose up --build

# Frontend: http://localhost:3000
# Backend API docs: http://localhost:8000/docs
```

**Local dev (no Docker):**

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev   # http://localhost:3000
```

---

## AWS Deployment

```
ECR (images) → ECS Fargate (containers) → ALB (load balancer)
                      ↓
              EFS or S3 (ChromaDB data volume)
              Secrets Manager (ANTHROPIC_API_KEY)
              CloudWatch (logs + metrics)
```

Tag and push:
```bash
aws ecr get-login-password | docker login --username AWS --password-stdin <ECR_URI>
docker build -t insuragent-backend ./backend
docker tag insuragent-backend <ECR_URI>/insuragent-backend:latest
docker push <ECR_URI>/insuragent-backend:latest
# Repeat for frontend
```

For production, swap ChromaDB → Pinecone by setting `VECTOR_STORE_BACKEND=pinecone` and the Pinecone credentials in `.env`.
