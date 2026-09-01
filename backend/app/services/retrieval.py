from sqlalchemy.orm import Session

from app.models import Assistant, DocumentChunk

TOP_K = 6


def retrieve_chunks(db: Session, assistant: Assistant, query_embedding: list[float]) -> list[dict]:
    doc_ids = [doc.id for doc in assistant.documents]
    if not doc_ids:
        return []

    rows = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.org_id == assistant.org_id)
        .filter(DocumentChunk.document_id.in_(doc_ids))
        .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
        .limit(TOP_K)
        .all()
    )

    filename_by_doc = {doc.id: doc.filename for doc in assistant.documents}

    return [
        {
            "document_id": row.document_id,
            "filename": filename_by_doc.get(row.document_id, "Unknown document"),
            "page_number": row.page_number,
            "content": row.content,
        }
        for row in rows
    ]
