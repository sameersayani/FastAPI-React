import uvicorn
from app import app 

if __name__ == "__main__":
    uvicorn.run(
        app="app:app",
        host="localhost",
        port=8000,
        reload=True
    )

# @app.get("/")
# def index(request: Request):
#     return templates.TemplateResponse(
#         name="home.html",
#         context={"request": request}
#     )