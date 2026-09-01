from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


# --- Auth ---

class SignupRequest(BaseModel):
    org_name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: str
    role: str
    org_id: str

    class Config:
        from_attributes = True


# --- Documents ---

class DocumentOut(BaseModel):
    id: str
    filename: str
    content_type: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Assistants ---

class AssistantCreate(BaseModel):
    name: str
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    allowed_roles: list[str] = ["admin", "employee"]
    document_ids: list[str] = []


class AssistantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    allowed_roles: Optional[list[str]] = None
    document_ids: Optional[list[str]] = None
    is_active: Optional[bool] = None


class AssistantOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    system_prompt: str
    allowed_roles: list[str]
    is_active: bool
    document_ids: list[str] = []

    class Config:
        from_attributes = True


# --- Chat ---

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class Citation(BaseModel):
    document_id: str
    filename: str
    page_number: Optional[int]
    snippet: str


class ChatResponse(BaseModel):
    conversation_id: str
    answer: str
    citations: list[Citation]
