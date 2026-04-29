from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import upload, chat, health

app = FastAPI(
    title="InsurAgent AI",
    description="RAG-powered agentic system for insurance policy analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(chat.router)
app.include_router(health.router)


@app.get("/")
async def root():
    return {"message": "InsurAgent AI API", "docs": "/docs"}
