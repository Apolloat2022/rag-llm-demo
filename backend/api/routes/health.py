from fastapi import APIRouter
from api.models import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", vector_count=0)
