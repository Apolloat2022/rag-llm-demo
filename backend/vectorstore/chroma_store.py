"""
ChromaDB vector store with an in-process docstore for parent chunks.
Swap VECTOR_STORE_BACKEND=pinecone in .env to use Pinecone in production.
"""
import os
import json
from pathlib import Path
from typing import Any

import chromadb
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

from ingestion.chunker import ChunkPair


_EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
_CHROMA_DIR = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma")
_DOCSTORE_PATH = os.getenv("DOCSTORE_PATH", "./data/docstore.json")


def _get_embeddings() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(
        model_name=_EMBED_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


class InsuranceVectorStore:
    """
    Manages:
    - ChromaDB collection of child-chunk embeddings
    - JSON docstore mapping parent_id → parent Document
    """

    def __init__(self) -> None:
        self._embeddings = _get_embeddings()
        Path(_CHROMA_DIR).mkdir(parents=True, exist_ok=True)
        self._chroma = Chroma(
            collection_name="insurance_policies",
            embedding_function=self._embeddings,
            persist_directory=_CHROMA_DIR,
        )
        self._docstore: dict[str, dict[str, Any]] = self._load_docstore()

    # --- Docstore helpers ---

    def _load_docstore(self) -> dict[str, Any]:
        p = Path(_DOCSTORE_PATH)
        if p.exists():
            return json.loads(p.read_text())
        return {}

    def _save_docstore(self) -> None:
        Path(_DOCSTORE_PATH).parent.mkdir(parents=True, exist_ok=True)
        Path(_DOCSTORE_PATH).write_text(json.dumps(self._docstore, indent=2))

    # --- Indexing ---

    def index_chunks(self, pairs: list[ChunkPair]) -> int:
        """Index a list of ChunkPairs. Returns number of child chunks added."""
        all_children: list[Document] = []
        for pair in pairs:
            parent_id = pair.parent.metadata["doc_id"]
            self._docstore[parent_id] = {
                "page_content": pair.parent.page_content,
                "metadata": pair.parent.metadata,
            }
            all_children.extend(pair.children)

        if all_children:
            self._chroma.add_documents(all_children)

        self._save_docstore()
        return len(all_children)

    # --- Retrieval ---

    def similarity_search(self, query: str, k: int = 20) -> list[Document]:
        """Return top-k child chunks by vector similarity."""
        return self._chroma.similarity_search(query, k=k)

    def get_parent(self, parent_id: str) -> Document | None:
        """Fetch a parent chunk by its ID from the docstore."""
        raw = self._docstore.get(parent_id)
        if raw is None:
            return None
        return Document(page_content=raw["page_content"], metadata=raw["metadata"])

    def fetch_parents_for_children(self, children: list[Document]) -> list[Document]:
        """Deduplicate and resolve child chunks to their parent documents."""
        seen: set[str] = set()
        parents: list[Document] = []
        for child in children:
            pid = child.metadata.get("parent_id")
            if pid and pid not in seen:
                seen.add(pid)
                parent = self.get_parent(pid)
                if parent:
                    parents.append(parent)
        return parents

    def collection_count(self) -> int:
        return self._chroma._collection.count()
