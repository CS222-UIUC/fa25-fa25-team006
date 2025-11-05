from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional

from .settings import settings
from .database import Base, engine, get_db, SessionLocal
from . import models, schemas
from .auth import get_password_hash, verify_password, create_access_token, get_current_user

app = FastAPI(title="CampusCache API", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[*settings.CORS_ORIGINS] if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize default users if they don't exist
@app.on_event("startup")
def init_default_users():
    db = SessionLocal()
    try:
        default_users = [
            {"username": "admin", "password": "password", "display_name": "Admin"},
            {"username": "alex", "password": "password", "display_name": "Alex"},
        ]
        for user_data in default_users:
            existing = db.query(models.User).filter(models.User.username == user_data["username"]).first()
            if not existing:
                user = models.User(
                    username=user_data["username"],
                    hashed_password=get_password_hash(user_data["password"]),
                    display_name=user_data["display_name"],
                )
                db.add(user)
                print(f"Created default user: {user_data['username']}")
            else:
                # Update password if user exists but password might be wrong
                # This ensures admin/password always works
                existing.hashed_password = get_password_hash(user_data["password"])
                existing.display_name = user_data["display_name"]
                print(f"Updated default user: {user_data['username']}")
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error initializing default users: {e}")
    finally:
        db.close()

# ---- Auth ----

@app.post("/auth/register", response_model=schemas.UserOut)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    user = models.User(
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        display_name=user_in.display_name or user_in.username,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/me", response_model=schemas.UserOut)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# ---- Caches CRUD ----

@app.post("/caches", response_model=schemas.CacheOut)
def create_cache(cache_in: schemas.CacheCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cache = models.Cache(**cache_in.dict(), creator_id=current_user.id)
    db.add(cache)
    db.commit()
    db.refresh(cache)
    return cache

@app.get("/caches", response_model=List[schemas.CacheOut])
def list_caches(q: Optional[str] = None, difficulty: Optional[int] = None, category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Cache)
    if q:
        query = query.filter(models.Cache.title.ilike(f"%{q}%"))
    if difficulty:
        query = query.filter(models.Cache.difficulty == difficulty)
    if category:
        query = query.filter(models.Cache.category == category)
    return query.order_by(models.Cache.created_at.desc()).all()

@app.get("/caches/{cache_id}", response_model=schemas.CacheOut)
def get_cache(cache_id: int, db: Session = Depends(get_db)):
    cache = db.query(models.Cache).get(cache_id)
    if not cache:
        raise HTTPException(404, "Cache not found")
    return cache

@app.patch("/caches/{cache_id}", response_model=schemas.CacheOut)
def update_cache(cache_id: int, cache_upd: schemas.CacheUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cache = db.query(models.Cache).get(cache_id)
    if not cache:
        raise HTTPException(404, "Cache not found")
    if cache.creator_id != current_user.id:
        raise HTTPException(403, "You can only edit your caches")
    for k, v in cache_upd.dict(exclude_unset=True).items():
        setattr(cache, k, v)
    db.commit()
    db.refresh(cache)
    return cache

@app.delete("/caches/{cache_id}")
def delete_cache(cache_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cache = db.query(models.Cache).get(cache_id)
    if not cache:
        raise HTTPException(404, "Cache not found")
    if cache.creator_id != current_user.id:
        raise HTTPException(403, "You can only delete your caches")
    db.delete(cache)
    db.commit()
    return {"ok": True}

# ---- Logs and Leaderboard ----

@app.post("/logs", response_model=schemas.LogOut)
def create_log(log_in: schemas.LogCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cache = db.query(models.Cache).get(log_in.cache_id)
    if not cache:
        raise HTTPException(404, "Cache not found")
    log = models.LogEntry(user_id=current_user.id, cache_id=log_in.cache_id, note=log_in.note)
    db.add(log)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(400, "You have already logged this cache")
    db.refresh(log)
    return log

@app.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db)):
    from sqlalchemy import func
    rows = (
        db.query(models.User.username, func.count(models.LogEntry.id).label("finds"))
        .join(models.LogEntry, models.LogEntry.user_id == models.User.id, isouter=True)
        .group_by(models.User.id)
        .order_by(func.count(models.LogEntry.id).desc())
        .limit(20)
        .all()
    )
    return [{"username": r[0], "finds": int(r[1] or 0)} for r in rows]
