"""
Cross-encoder re-ranker using ms-marco-MiniLM.

Why a re-ranker?
Cosine similarity retrieves semantically close vectors but doesn't score
query-document relevance as a pair. A cross-encoder reads both together,
catching cases where the query keyword appears with opposite negation in
the retrieved chunk ("does NOT cover flood damage").
"""
from __future__ import annotations

from sentence_transformers import CrossEncoder
from langchain_core.documents import Document

_MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"
_reranker: CrossEncoder | None = None


def _get_reranker() -> CrossEncoder:
    global _reranker
    if _reranker is None:
        _reranker = CrossEncoder(_MODEL_NAME, max_length=512)
    return _reranker


def rerank(
    query: str,
    documents: list[Document],
    top_k: int = 5,
) -> list[Document]:
    """
    Score every document against the query and return the top_k highest-scoring ones.
    The relevance score is stored in doc.metadata["rerank_score"].
    """
    if not documents:
        return []

    reranker = _get_reranker()
    pairs = [(query, doc.page_content) for doc in documents]
    scores: list[float] = reranker.predict(pairs).tolist()

    scored = sorted(
        zip(scores, documents),
        key=lambda x: x[0],
        reverse=True,
    )

    results: list[Document] = []
    for score, doc in scored[:top_k]:
        doc.metadata["rerank_score"] = round(score, 4)
        results.append(doc)

    return results
