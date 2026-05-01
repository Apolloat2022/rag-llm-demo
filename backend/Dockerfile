FROM python:3.11-slim

WORKDIR /app

# Install system deps for PyMuPDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*

COPY dependencies.txt .
RUN pip install --no-cache-dir -r dependencies.txt

COPY . .

# Pre-index the mock policy PDF at build time so the demo works immediately
# without requiring an upload. The vector store is baked into the image.
RUN python -c "\
from pathlib import Path; \
from ingestion.pdf_parser import parse_pdf; \
from ingestion.chunker import blocks_to_chunk_pairs; \
from vectorstore.chroma_store import InsuranceVectorStore; \
blocks = parse_pdf(Path('mock_homeowner_policy.pdf')); \
pairs = blocks_to_chunk_pairs(blocks); \
store = InsuranceVectorStore(); \
count = store.index_chunks(pairs); \
print(f'Seeded {count} chunks from mock_homeowner_policy.pdf')"

EXPOSE 8000

CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
