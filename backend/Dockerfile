FROM python:3.11-slim

WORKDIR /app

# Install system deps for PyMuPDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*

COPY dependencies.txt .
RUN pip install --no-cache-dir -r dependencies.txt

COPY . .

# Pre-download chromadb's built-in ONNX model at build time (baked into image)
RUN python -c "\
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction; \
DefaultEmbeddingFunction()(['warmup'])"

EXPOSE 8000

CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
