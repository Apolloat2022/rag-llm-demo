import os
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())  # walks up from backend/ until it finds .env

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import upload, chat, health

app = FastAPI(
    title="InsurAgent AI",
    description="RAG-powered agentic system for insurance policy analysis",
    version="1.0.0",
)

_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
_origins = [o.strip() for o in _origins_env.split(",")] if _origins_env != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(chat.router)
app.include_router(health.router)


@app.get("/")
async def root():
    return {"message": "InsurAgent AI API", "docs": "/docs"}
