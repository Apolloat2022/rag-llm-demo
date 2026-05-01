FROM python:3.11-slim

WORKDIR /app

# Install system deps for PyMuPDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*

COPY dependencies.txt .
RUN pip install --no-cache-dir -r dependencies.txt

COPY . .

# Pre-download the fastembed ONNX model at build time (baked into image, no cold-start download)
RUN python -c "\
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings; \
FastEmbedEmbeddings(model_name='BAAI/bge-small-en-v1.5').embed_query('warmup')"

EXPOSE 8000

CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
