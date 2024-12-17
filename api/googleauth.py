from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from dotenv import load_dotenv
import os
from fastapi import FastAPI, APIRouter, Depends, Request
from fastapi.security import OAuth2AuthorizationCodeBearer
from fastapi.openapi.docs import get_swagger_ui_html

# Load environment variables from .env file
load_dotenv()

# Fetch configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
SECRET_KEY = os.getenv("SECRET_KEY")

if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET or not SECRET_KEY:
    raise RuntimeError("Missing required environment variables")

# Initialize OAuth
oauth = OAuth()
google = oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

# In-memory session storage (for demonstration)
user_sessions = {}

# OAuth2 scheme
oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl="https://accounts.google.com/o/oauth2/auth",
    tokenUrl="https://oauth2.googleapis.com/token",
    scopes={"openid": "OpenID Connect scope"},
)

# Create APIRouter instance
router = APIRouter()


# @router.get("/api/auth/login")
# async def login(request: Request):
#     state = generate_state()
#     request.session["state"] = state
#     print(f"State set in session: {state}")
#     redirect_uri = f"https://oauth2provider.com/auth?state={state}&redirect_uri=http://127.0.0.1:8000/api/auth/callback"
#     return RedirectResponse(redirect_uri)

# @router.get("/api/auth/callback")
# async def callback(request: Request):
#     state_received = request.query_params.get("state")
#     state_stored = request.session.get("state")
#     print(f"State received: {state_received}, State stored: {state_stored}")

#     if state_received != state_stored:
#         raise HTTPException(status_code=400, detail="CSRF attack detected")
#     return {"message": "OAuth authentication successful"}

# @router.get("/auth/logout", summary="Logout user")
# async def logout(user_id: str):
#     user_sessions.pop(user_id, None)
#     return {"message": "Logged out successfully"}

# @router.get("/protected", summary="Protected endpoint")
# async def protected_endpoint(user_id: str):
#     user = user_sessions.get(user_id)
#     if not user:
#         raise HTTPException(status_code=401, detail="Unauthorized")
#     return {"message": "This is a protected route", "user": user}

# Helper function to simulate Google Login and Redirect
@router.get("/auth/login", tags=["Authentication"])
async def login(request: Request):
    state = "example_state_value"
    request.session["state"] = state
    redirect_uri = "http://127.0.0.1:8000/api/auth/callback"
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/auth?"
        f"response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri={redirect_uri}&scope=openid%20email%20profile&state={state}"
    )
    return RedirectResponse(google_auth_url)

@router.get("/auth/callback", tags=["Authentication"])
async def callback(request: Request):
    # Simulate state checking here
    state_received = request.query_params.get("state")
    state_stored = request.session.get("state")
    if state_received != state_stored:
        return {"error": "State mismatch"}
    return {"message": "Google Authentication Successful"}

# Protected Route
@router.get("/protected", tags=["Protected"], dependencies=[Depends(oauth2_scheme)])
async def protected():
    return {"message": "You are authenticated and can access this endpoint!"}
