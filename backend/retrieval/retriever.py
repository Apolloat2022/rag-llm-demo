"""
Full RAG retrieval chain:
  1. Embed query → ChromaDB top-20 child chunks
  2. Resolve child chunks → parent documents (richer context)
  3. Cross-encoder re-rank parents → top-5
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
    """
    Parent-Document Retrieval with re-ranking.

    child_k  — how many child chunks to pull from ChromaDB (wider net)
    final_k  — how many parent docs to keep after re-ranking (shown to LLM)
    """
    store = get_store()

    # Step 1: vector search on small child chunks
    child_hits = store.similarity_search(query, k=child_k)

    # Step 2: fetch richer parent docs
    parents = store.fetch_parents_for_children(child_hits)

    # Step 3: re-rank parents against the original query
    reranked = rerank(query, parents, top_k=final_k)

    # Step 4: build citation objects for the UI
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
