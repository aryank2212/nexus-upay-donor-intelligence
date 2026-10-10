from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routers import auth, contact, copilot, dashboard, donors, imports, insights, public, review, seed
from app import seed as seed_module

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_module.ensure_demo_user(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="NEXUS - UPAY Donor & Donation Intelligence", version="0.1.0", lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(contact.router)
app.include_router(public.router)
app.include_router(imports.router)
app.include_router(donors.router)
app.include_router(review.router)
app.include_router(dashboard.router)
app.include_router(copilot.router)
app.include_router(insights.router)
app.include_router(seed.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
