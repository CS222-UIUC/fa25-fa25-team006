from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, UniqueConstraint, Table
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from .database import Base

# Association table for many-to-many relationship between users and liked caches
cache_likes = Table(
    "cache_likes",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("cache_id", Integer, ForeignKey("caches.id"), primary_key=True),
    Column("created_at", DateTime, default=datetime.utcnow),
)

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(100), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    caches: Mapped[list["Cache"]] = relationship("Cache", back_populates="creator")
    logs: Mapped[list["LogEntry"]] = relationship("LogEntry", back_populates="user")
    liked_caches: Mapped[list["Cache"]] = relationship("Cache", secondary=cache_likes, back_populates="liked_by")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', display_name='{self.display_name}')>"

class Cache(Base):
    __tablename__ = "caches"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    difficulty: Mapped[int] = mapped_column(Integer, default=1)
    category: Mapped[str] = mapped_column(String(50), default="general")
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    creator: Mapped["User"] = relationship("User", back_populates="caches")
    logs: Mapped[list["LogEntry"]] = relationship("LogEntry", back_populates="cache", cascade="all, delete")
    liked_by: Mapped[list["User"]] = relationship("User", secondary=cache_likes, back_populates="liked_caches")

    def __repr__(self):
        return f"<Cache(id={self.id}, title='{self.title}', creator_id={self.creator_id})>"

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

    def __repr__(self):
        return f"<LogEntry(id={self.id}, user_id={self.user_id}, cache_id={self.cache_id})>"
