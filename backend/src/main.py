from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.settings import settings

app = FastAPI(name="ustadh backend", description="Ustadh backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}
