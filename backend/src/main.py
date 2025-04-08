from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.settings import settings
from src.api.endpoints import router
from src.utils import lifespan

app = FastAPI(
    name="ustadh backend",
    description="Ustadh backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=settings.ALLOWED_EXPOSED_HEADERS,
)

app.include_router(router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {"message": "Hello World"}
