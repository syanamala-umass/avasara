from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, startups, contributors, tasks, task_assignments, reviews, skills
from app.database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Contributor Platform API",
    description="API for connecting startups with skilled contributors in a peer review system",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:3000",  # React frontend
    "https://avasara.com"  # Production domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(startups.router)
app.include_router(contributors.router)
app.include_router(tasks.router)
app.include_router(task_assignments.router)  # Updated from applications
app.include_router(reviews.router)
app.include_router(skills.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Contributor Platform API",
        "description": "A platform where contributors can pick up tasks posted by startups and receive peer reviews"
    }