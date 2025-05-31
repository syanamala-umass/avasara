from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, startups, tasks, task_assignment, reviews, skills, landing_page, peer_evaluation
from app.database import engine, Base
from app import models

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Avasara API",
    description="API for Avasara platform with peer evaluation system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(startups.router)
app.include_router(tasks.router)
app.include_router(task_assignment.router)
app.include_router(reviews.router)
app.include_router(skills.router)
app.include_router(landing_page.router)
app.include_router(peer_evaluation.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Avasara API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }