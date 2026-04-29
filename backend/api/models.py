from pydantic import BaseModel, Field
from typing import Any


class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Unique conversation session ID")
    message: str = Field(..., min_length=1, max_length=4000)


class Citation(BaseModel):
    source: str
    page: int | str
    block_type: str
    rerank_score: float
    snippet: str


class ChatResponse(BaseModel):
    session_id: str
    answer: str
    citations: list[Citation] = []
    tool_calls_made: list[str] = []


class UploadResponse(BaseModel):
    filename: str
    chunks_indexed: int
    message: str


class HealthResponse(BaseModel):
    status: str
    vector_count: int
