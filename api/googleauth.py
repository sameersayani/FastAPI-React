import os
import random
import string
import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2AuthorizationCodeBearer
from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Fetch configuration from environment variables
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
SECRET_KEY = os.getenv("SECRET_KEY", "your_default_secret_key")

if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET or not SECRET_KEY:
    raise RuntimeError("Missing required environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, SECRET_KEY")

# Initialize OAuth
oauth = OAuth()
google = oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    access_token_url="https://accounts.google.com/o/oauth2/token",
    authorize_url="https://accounts.google.com/o/oauth2/auth",
    client_kwargs={"scope": "openid email profile"},
)

# Router for authentication endpoints
router = APIRouter()

# OAuth2 scheme for protected routes
oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl="https://accounts.google.com/o/oauth2/auth",
    tokenUrl="https://accounts.google.com/o/oauth2/token",
    scopes={"openid": "OpenID Connect scope"},
)

# JWT Configuration
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 1  # Adjust the token expiry as needed


def create_jwt(user_info: dict) -> str:
    """Generate a JWT token for authenticated users."""
    payload = {
        "sub": user_info.get("email"),
        "name": user_info.get("name"),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token


def generate_state() -> str:
    """Generate a random state string for CSRF protection."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=16))


@router.get("/auth/login", tags=["Authentication"])
async def login(request: Request, redirect_uri: str):
    """
    Redirect users to Google for authentication.
    Query Parameter:
    - `redirect_uri`: The URL where users are redirected after authentication.
    """
    redirect_uri = request.query_params.get("redirect_uri")
    if not redirect_uri:
        raise HTTPException(status_code=400, detail="Missing redirect_uri parameter")

    state = generate_state()
    request.session["state"] = state  # Store state in the session for CSRF protection
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/auth/callback", tags=["Authentication"])
async def callback(request: Request):
    """
    Handle the OAuth2 callback from Google.
    Query Parameters:
    - `state`: State to verify CSRF protection.
    - `code`: Authorization code to exchange for an access token.
    """
    state_received = request.query_params.get("state")
    code = request.query_params.get("code")

    # Validate the state to prevent CSRF attacks
    state_stored = request.session.get("state")
    if state_received != state_stored:
        raise HTTPException(status_code=400, detail="State mismatch (CSRF detected)")

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    try:
        # Exchange the authorization code for an access token
        token = await oauth.google.authorize_access_token(request)

        # Extract user info from the token
        user_info = token.get("userinfo")
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to fetch user information")

        # Generate a JWT for the user
        jwt_token = create_jwt(user_info)

        return {"access_token": jwt_token, "user_info": user_info}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")


@router.get("/protected", tags=["Protected"], dependencies=[Depends(oauth2_scheme)])
async def protected():
    """Protected endpoint accessible only to authenticated users."""
    return {"message": "You are authenticated and can access this endpoint!"}


@router.get("/test", tags=["Test"])
async def test_route():
    """Test route to verify the server is running correctly."""
    return {"message": "Test route is working"}
