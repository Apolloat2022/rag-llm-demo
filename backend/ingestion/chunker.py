"""
Parent-Child chunking strategy.

Parent chunks  (~512 tokens) — stored in a docstore, returned to the LLM.
Child chunks   (~128 tokens) — embedded and stored in ChromaDB for retrieval.

This gives dense, precise vector search while the LLM receives richer context.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from ingestion.pdf_parser import ParsedBlock


@dataclass
class ChunkPair:
    parent: Document
    children: list[Document]


PARENT_SPLITTER = RecursiveCharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=64,
    separators=["\n\n", "\n", " ", ""],
)

CHILD_SPLITTER = RecursiveCharacterTextSplitter(
    chunk_size=128,
    chunk_overlap=16,
    separators=["\n\n", "\n", " ", ""],
)


def blocks_to_chunk_pairs(blocks: list[ParsedBlock]) -> list[ChunkPair]:
    """
    Convert raw parsed blocks into parent-child document pairs ready for indexing.
    Each ParsedBlock → N parent chunks → M child chunks per parent.
    """
    pairs: list[ChunkPair] = []

    for block in blocks:
        base_meta = {
            "source": block.source,
            "page": block.page,
            "block_type": block.block_type,
            "bbox": str(block.bbox),
        }

        parent_docs = PARENT_SPLITTER.create_documents(
            [block.text], metadatas=[base_meta]
        )

        for parent_doc in parent_docs:
            parent_id = str(uuid.uuid4())
            parent_doc.metadata["doc_id"] = parent_id

            children = CHILD_SPLITTER.create_documents(
                [parent_doc.page_content],
                metadatas=[{**parent_doc.metadata, "parent_id": parent_id}],
            )
            for child in children:
                child.metadata["doc_id"] = str(uuid.uuid4())

            pairs.append(ChunkPair(parent=parent_doc, children=children))

    return pairs
