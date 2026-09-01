from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_admin
from app.models import Assistant, Document, User
from app.schemas import AssistantCreate, AssistantOut, AssistantUpdate

router = APIRouter(prefix="/assistants", tags=["assistants"])


def _to_out(assistant: Assistant) -> AssistantOut:
    return AssistantOut(
        id=assistant.id,
        name=assistant.name,
        description=assistant.description,
        system_prompt=assistant.system_prompt,
        allowed_roles=assistant.allowed_roles or [],
        is_active=assistant.is_active,
        document_ids=[d.id for d in assistant.documents],
    )


@router.get("", response_model=list[AssistantOut])
def list_assistants(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    assistants = (
        db.query(Assistant)
        .filter(Assistant.org_id == user.org_id, Assistant.is_active.is_(True))
        .order_by(Assistant.created_at.desc())
        .all()
    )
    return [_to_out(a) for a in assistants if a.is_accessible_by(user)]


@router.get("/{assistant_id}", response_model=AssistantOut)
def get_assistant(assistant_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    assistant = db.get(Assistant, assistant_id)
    if not assistant or assistant.org_id != user.org_id or not assistant.is_accessible_by(user):
        raise HTTPException(status_code=404, detail="Assistant not found")
    return _to_out(assistant)


@router.post("", response_model=AssistantOut)
def create_assistant(payload: AssistantCreate, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    assistant = Assistant(
        org_id=user.org_id,
        name=payload.name,
        description=payload.description,
        system_prompt=payload.system_prompt or "You are a helpful company knowledge assistant.",
        allowed_roles=payload.allowed_roles,
    )
    if payload.document_ids:
        docs = (
            db.query(Document)
            .filter(Document.org_id == user.org_id, Document.id.in_(payload.document_ids))
            .all()
        )
        assistant.documents = docs

    db.add(assistant)
    db.commit()
    db.refresh(assistant)
    return _to_out(assistant)


@router.put("/{assistant_id}", response_model=AssistantOut)
def update_assistant(
    assistant_id: str,
    payload: AssistantUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_admin),
):
    assistant = db.get(Assistant, assistant_id)
    if not assistant or assistant.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Assistant not found")

    if payload.name is not None:
        assistant.name = payload.name
    if payload.description is not None:
        assistant.description = payload.description
    if payload.system_prompt is not None:
        assistant.system_prompt = payload.system_prompt
    if payload.allowed_roles is not None:
        assistant.allowed_roles = payload.allowed_roles
    if payload.is_active is not None:
        assistant.is_active = payload.is_active
    if payload.document_ids is not None:
        docs = (
            db.query(Document)
            .filter(Document.org_id == user.org_id, Document.id.in_(payload.document_ids))
            .all()
        )
        assistant.documents = docs

    db.commit()
    db.refresh(assistant)
    return _to_out(assistant)


@router.delete("/{assistant_id}", status_code=204)
def delete_assistant(assistant_id: str, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    assistant = db.get(Assistant, assistant_id)
    if not assistant or assistant.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Assistant not found")
    db.delete(assistant)
    db.commit()
