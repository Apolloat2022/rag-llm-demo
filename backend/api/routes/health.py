from fastapi import APIRouter
from api.models import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health():
    try:
        from retrieval.retriever import get_store
        count = get_store().collection_count()
    except Exception:
        count = 0
    return HealthResponse(status="ok", vector_count=count)
