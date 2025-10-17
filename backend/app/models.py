from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(100), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    caches: Mapped[list["Cache"]] = relationship("Cache", back_populates="creator")
    logs: Mapped[list["LogEntry"]] = relationship("LogEntry", back_populates="user")

class Cache(Base):
    __tablename__ = "caches"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    difficulty: Mapped[int] = mapped_column(Integer, default=1)  # 1-5
    category: Mapped[str] = mapped_column(String(50), default="general")
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    creator: Mapped["User"] = relationship("User", back_populates="caches")
    logs: Mapped[list["LogEntry"]] = relationship("LogEntry", back_populates="cache", cascade="all, delete")

class LogEntry(Base):
    __tablename__ = "logs"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    cache_id: Mapped[int] = mapped_column(ForeignKey("caches.id"))
    note: Mapped[str] = mapped_column(Text, default="")
    found_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="logs")
    cache: Mapped["Cache"] = relationship("Cache", back_populates="logs")

    __table_args__ = (
        UniqueConstraint('user_id', 'cache_id', name='unique_find_per_user_cache'),
    )
