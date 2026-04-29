from fastapi import APIRouter
from vectorstore.chroma_store import InsuranceVectorStore
from api.models import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])
_store = InsuranceVectorStore()


@router.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        vector_count=_store.collection_count(),
    )
