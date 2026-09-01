import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Assistant, Conversation, Message, User
from app.schemas import ChatRequest, ChatResponse, Citation
from app.services.embeddings import embed_query
from app.services.llm import generate_answer
from app.services.retrieval import retrieve_chunks

router = APIRouter(prefix="/assistants", tags=["chat"])

SNIPPET_LENGTH = 280


@router.post("/{assistant_id}/chat", response_model=ChatResponse)
def chat(
    assistant_id: str,
    payload: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    assistant = db.get(Assistant, assistant_id)
    if not assistant or assistant.org_id != user.org_id or not assistant.is_accessible_by(user):
        raise HTTPException(status_code=404, detail="Assistant not found")

    if payload.conversation_id:
        conversation = db.get(Conversation, payload.conversation_id)
        if not conversation or conversation.user_id != user.id or conversation.assistant_id != assistant.id:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(assistant_id=assistant.id, user_id=user.id)
        db.add(conversation)
        db.flush()

    query_embedding = embed_query(payload.message)
    chunks = retrieve_chunks(db, assistant, query_embedding)
    answer = generate_answer(assistant.system_prompt, payload.message, chunks)

    citations = [
        Citation(
            document_id=c["document_id"],
            filename=c["filename"],
            page_number=c["page_number"],
            snippet=c["content"][:SNIPPET_LENGTH],
        )
        for c in chunks
    ]

    db.add(Message(conversation_id=conversation.id, role="user", content=payload.message))
    db.add(
        Message(
            conversation_id=conversation.id,
            role="assistant",
            content=answer,
            citations=json.dumps([c.model_dump() for c in citations]),
        )
    )
    db.commit()

    return ChatResponse(conversation_id=conversation.id, answer=answer, citations=citations)
