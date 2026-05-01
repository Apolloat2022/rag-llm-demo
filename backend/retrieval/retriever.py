"""
Full RAG retrieval chain:
  1. Embed query → ChromaDB top-20 child chunks (with similarity scores)
  2. Resolve child chunks → parent documents (richer context)
  3. Promote best child score to each parent → sort → top-5
  4. Return docs + citation metadata
"""
from __future__ import annotations

from dataclasses import dataclass

from langchain_core.documents import Document

from vectorstore.chroma_store import InsuranceVectorStore
from retrieval.reranker import rerank


@dataclass
class RetrievalResult:
    documents: list[Document]
    citations: list[dict]


_store: InsuranceVectorStore | None = None


def get_store() -> InsuranceVectorStore:
    global _store
    if _store is None:
        _store = InsuranceVectorStore()
    return _store


def retrieve(
    query: str,
    *,
    child_k: int = 20,
    final_k: int = 5,
) -> RetrievalResult:
    store = get_store()

    # Step 1: vector search on small child chunks (scores in metadata)
    child_hits = store.similarity_search(query, k=child_k)

    # Step 2: build parent_id → best child score map
    parent_best_score: dict[str, float] = {}
    for child in child_hits:
        pid = child.metadata.get("parent_id")
        score = child.metadata.get("similarity_score", 0.0)
        if pid and score > parent_best_score.get(pid, 0.0):
            parent_best_score[pid] = score

    # Step 3: fetch richer parent docs and tag with score
    parents = store.fetch_parents_for_children(child_hits)
    for parent in parents:
        pid = parent.metadata.get("doc_id")
        parent.metadata["rerank_score"] = round(parent_best_score.get(pid, 0.0), 4)

    # Step 4: sort by score, keep top_k
    reranked = rerank(query, parents, top_k=final_k)

    # Step 5: build citation objects for the UI
    citations = [
        {
            "source": doc.metadata.get("source", "unknown"),
            "page": doc.metadata.get("page", "?"),
            "block_type": doc.metadata.get("block_type", "text"),
            "rerank_score": doc.metadata.get("rerank_score", 0.0),
            "snippet": doc.page_content[:200],
        }
        for doc in reranked
    ]

    return RetrievalResult(documents=reranked, citations=citations)
