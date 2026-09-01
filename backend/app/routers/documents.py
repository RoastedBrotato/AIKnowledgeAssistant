import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import require_admin
from app.models import Document, DocumentChunk, User
from app.schemas import DocumentOut
from app.services.embeddings import embed_texts
from app.services.ingestion import chunk_pages, extract_pages

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}


@router.get("", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), user: User = Depends(require_admin)):
    return db.query(Document).filter(Document.org_id == user.org_id).order_by(Document.created_at.desc()).all()


@router.post("/upload", response_model=DocumentOut)
def upload_document(file: UploadFile, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF and DOCX files are supported")

    org_dir = os.path.join(settings.upload_dir, user.org_id)
    os.makedirs(org_dir, exist_ok=True)
    stored_name = f"{uuid.uuid4()}_{file.filename}"
    storage_path = os.path.join(org_dir, stored_name)

    with open(storage_path, "wb") as f:
        f.write(file.file.read())

    document = Document(
        org_id=user.org_id,
        filename=file.filename,
        content_type=file.content_type,
        storage_path=storage_path,
        uploaded_by=user.id,
        status="processing",
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    try:
        _process_document(db, document)
    except Exception:
        document.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to process document")

    return document


def _process_document(db: Session, document: Document) -> None:
    pages = extract_pages(document.storage_path, document.content_type)
    chunks = chunk_pages(pages)

    if not chunks:
        document.status = "failed"
        db.commit()
        return

    embeddings = embed_texts([c.content for c in chunks])

    for chunk, embedding in zip(chunks, embeddings):
        db.add(
            DocumentChunk(
                document_id=document.id,
                org_id=document.org_id,
                chunk_index=chunk.chunk_index,
                page_number=chunk.page_number,
                content=chunk.content,
                embedding=embedding,
            )
        )

    document.status = "ready"
    db.commit()


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: str, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    document = db.get(Document, document_id)
    if not document or document.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Document not found")

    if os.path.exists(document.storage_path):
        os.remove(document.storage_path)

    db.delete(document)
    db.commit()
