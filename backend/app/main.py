from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import blind

app = FastAPI(title="Jalousiesteuerung API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(blind.router, prefix="/api/blind", tags=["blind"])


@app.get("/")
async def root():
    return {"status": "Jalousiesteuerung Backend läuft"}
