import uvicorn
from fastapi import FastAPI, APIRouter
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

app = FastAPI()
# router = APIRouter()
# app.include_router(router)

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