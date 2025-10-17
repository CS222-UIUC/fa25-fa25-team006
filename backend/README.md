# CampusCache Backend (FastAPI)

## Quickstart
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # then edit SECRET_KEY if you like
uvicorn app.main:app --reload
```
API docs: http://127.0.0.1:8000/docs
