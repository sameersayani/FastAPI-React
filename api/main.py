from app import app
import uvicorn
from fastapi import FastAPI, APIRouter,Depends, HTTPException,requests
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
AUTH_SERVICE_URL = "http://127.0.0.1:8001"  # Change to deployed URL if needed
# router = APIRouter()
# app.include_router(router)

origins = [
    "http://127.0.0.1:3000",  # React app URL
    "http://localhost:3000",   # In case you are using localhost instead of 127.0.0.1
]

# Apply CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allow the React frontend to make requests to the FastAPI backend
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

templates = Jinja2Templates(directory="templates")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
    
@app.get("/login/google")
async def login_google():
    return {"login_url": f"{AUTH_SERVICE_URL}/login/google"}

@app.get("/auth/callback")
async def auth_callback(code: str):
    response = requests.get(f"{AUTH_SERVICE_URL}/auth/callback?code={code}")
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="OAuth Failed")
    return response.json()

@app.get("/me")
async def get_current_user(token: str):
    response = requests.get(f"{AUTH_SERVICE_URL}/me", headers={"Authorization": f"Bearer {token}"})
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Token")
    return response.json()
