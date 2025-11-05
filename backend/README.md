GeoCache Backend (Team 006)

Backend for our CS222 project. Provides REST APIs for authentication, nearby cache search, favorites, finds, and recommendations.

Setup
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload   # or flask --app app.py run


Frontend expects it at http://localhost:8000.

Key Endpoints
Route	Method	Description
/api/login	POST	Authenticates user (admin / alex)
/api/me	GET	Returns current user
/api/logout	POST	Logs out
/api/caches	GET	Lists caches near lat, lon, delta
/api/finds	POST	Logs a find
/api/favorites	GET	Lists favorites
/api/favorites/toggle	POST	Adds/removes favorite
/api/recommendations	GET	User-specific recs

Auth routes use header:
x-auth-token: <token>

Example
curl "http://localhost:8000/api/caches?lat=40.11&lon=-88.22&delta=0.02"

Notes

Enable CORS if frontend is on another port.

Token stored in localStorage.

Test with pytest.

Contributors: Fatheen • Sai Pranav Kakumanu • Jroma27-cmd
