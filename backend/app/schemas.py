from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class Token(BaseModel):
    access_token: str = Field(..., example="abc123token")
    token_type: str = "bearer"

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, example="johndoe")
    password: str = Field(..., min_length=6, max_length=128, example="secret123")
    display_name: Optional[str] = Field(None, example="John Doe")

class UserOut(BaseModel):
    id: int
    username: str
    display_name: Optional[str] = ""
    created_at: datetime

    class Config:
        from_attributes = True

class CacheBase(BaseModel):
    title: str = Field(..., example="Hidden Treasure")
    description: str = ""
    latitude: float
    longitude: float
    difficulty: int = Field(1, ge=1, le=5)
    category: str = "general"

class CacheCreate(CacheBase):
    pass

class CacheUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    difficulty: Optional[int] = Field(None, ge=1, le=5)
    category: Optional[str] = None

class CacheOut(CacheBase):
    id: int
    creator_id: int
    created_at: datetime
    like_count: Optional[int] = 0
    is_liked: Optional[bool] = False

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
