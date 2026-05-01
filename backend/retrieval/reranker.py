"""
Score-based re-ranker (no cross-encoder, no torch).

Documents arriving here already carry a similarity_score from ChromaDB in their
metadata (set by InsuranceVectorStore.similarity_search). We promote the best
child score to the parent and sort descending.
"""
from __future__ import annotations

from langchain_core.documents import Document


def rerank(
    query: str,
    documents: list[Document],
    top_k: int = 5,
) -> list[Document]:
    """Return the top_k documents sorted by their pre-computed rerank_score."""
    if not documents:
        return []

    sorted_docs = sorted(
        documents,
        key=lambda d: d.metadata.get("rerank_score", 0.0),
        reverse=True,
    )
    return sorted_docs[:top_k]
