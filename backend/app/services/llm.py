from openai import OpenAI

from app.config import settings

_client = OpenAI(api_key=settings.openai_api_key, base_url=settings.openai_base_url or None)

BASE_INSTRUCTIONS = """You are a company knowledge assistant. Answer the user's question using ONLY the numbered
source excerpts provided below. Cite the sources you used inline like [1], [2].
If the excerpts do not contain the answer, say so plainly instead of guessing."""


def build_context_block(chunks: list[dict]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, start=1):
        page = f", page {chunk['page_number']}" if chunk.get("page_number") else ""
        parts.append(f"[{i}] {chunk['filename']}{page}\n{chunk['content']}")
    return "\n\n".join(parts)


def generate_answer(system_prompt: str, question: str, chunks: list[dict]) -> str:
    context_block = build_context_block(chunks) if chunks else "(no relevant documents found)"

    messages = [
        {"role": "system", "content": f"{system_prompt}\n\n{BASE_INSTRUCTIONS}"},
        {
            "role": "user",
            "content": f"Source excerpts:\n\n{context_block}\n\nQuestion: {question}",
        },
    ]

    response = _client.chat.completions.create(
        model=settings.chat_model,
        messages=messages,
        temperature=0.2,
    )
    return response.choices[0].message.content or ""
