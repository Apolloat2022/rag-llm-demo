import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from ingestion.pdf_parser import parse_pdf
from ingestion.chunker import blocks_to_chunk_pairs
from vectorstore.chroma_store import InsuranceVectorStore
from api.models import UploadResponse

router = APIRouter(prefix="/api", tags=["ingestion"])
_store: InsuranceVectorStore | None = None


def _get_store() -> InsuranceVectorStore:
    global _store
    if _store is None:
        _store = InsuranceVectorStore()
    return _store


@router.post("/upload", response_model=UploadResponse)
async def upload_policy(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        blocks = parse_pdf(tmp_path)
        pairs = blocks_to_chunk_pairs(blocks)
        indexed = _get_store().index_chunks(pairs)
    finally:
        tmp_path.unlink(missing_ok=True)

    return UploadResponse(
        filename=file.filename,
        chunks_indexed=indexed,
        message=f"Successfully indexed {indexed} chunks from '{file.filename}'.",
    )
