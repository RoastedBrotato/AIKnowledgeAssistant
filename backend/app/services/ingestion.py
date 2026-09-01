from dataclasses import dataclass

from docx import Document as DocxDocument
from pypdf import PdfReader

CHUNK_SIZE = 1500
CHUNK_OVERLAP = 200


@dataclass
class PageText:
    page_number: int | None
    text: str


@dataclass
class Chunk:
    chunk_index: int
    page_number: int | None
    content: str


def extract_pages(file_path: str, content_type: str) -> list[PageText]:
    if content_type == "application/pdf":
        return _extract_pdf(file_path)
    if content_type in (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ):
        return _extract_docx(file_path)
    raise ValueError(f"Unsupported content type: {content_type}")


def _extract_pdf(file_path: str) -> list[PageText]:
    reader = PdfReader(file_path)
    pages = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        if text.strip():
            pages.append(PageText(page_number=i + 1, text=text))
    return pages


def _extract_docx(file_path: str) -> list[PageText]:
    doc = DocxDocument(file_path)
    full_text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    return [PageText(page_number=None, text=full_text)] if full_text.strip() else []


def chunk_pages(pages: list[PageText]) -> list[Chunk]:
    chunks: list[Chunk] = []
    index = 0
    for page in pages:
        text = page.text
        start = 0
        while start < len(text):
            end = start + CHUNK_SIZE
            piece = text[start:end].strip()
            if piece:
                chunks.append(Chunk(chunk_index=index, page_number=page.page_number, content=piece))
                index += 1
            if end >= len(text):
                break
            start = end - CHUNK_OVERLAP
    return chunks
