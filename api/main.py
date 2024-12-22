import uvicorn
from fastapi import FastAPI, APIRouter
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
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
    uvicorn.run(
        app="app:app",
        host="localhost",
        port=8000,
        reload=True
    )

@app.get("/")
def index(request: Request):
    return templates.TemplateResponse(
        name="home.html",
        context={"request": request}
    )