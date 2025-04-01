from fastapi import FastAPI

app = FastAPI(name="ustadh backend", description="Ustadh backend", version="0.1.0")

@app.get("/")
async def root():
    return {"message": "Hello World"}
