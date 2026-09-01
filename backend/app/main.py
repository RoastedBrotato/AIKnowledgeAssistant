from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import Base, engine
from app.routers import assistants, auth, chat, documents

app = FastAPI(title="KnowledgeOS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind=engine)


app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(assistants.router)
app.include_router(chat.router)


@app.get("/health")
def health():
    return {"status": "ok"}
