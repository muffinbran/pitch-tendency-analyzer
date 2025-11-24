from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import session_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session_router.router)

@app.get("/test")
def test_endpoint():
    return {"message": "Hello from FastAPI!"}
