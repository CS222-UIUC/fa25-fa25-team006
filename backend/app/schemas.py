from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=128)
    display_name: str | None = None

class UserOut(BaseModel):
    id: int
    username: str
    display_name: Optional[str] = ""
    created_at: datetime
    class Config:
        from_attributes = True

class CacheBase(BaseModel):
    title: str
    description: str = ""
    latitude: float
    longitude: float
    difficulty: int = Field(ge=1, le=5)
    category: str = "general"

class CacheCreate(CacheBase):
    pass

class CacheUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    difficulty: int | None = Field(default=None, ge=1, le=5)
    category: str | None = None

class CacheOut(CacheBase):
    id: int
    creator_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class LogCreate(BaseModel):
    cache_id: int
    note: str = ""

class LogOut(BaseModel):
    id: int
    user_id: int
    cache_id: int
    note: str
    found_at: datetime
    class Config:
        from_attributes = True
