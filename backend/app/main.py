from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import logging
import time
import sys


from app.routers import auth, startups, tasks, task_assignment, reviews, skills, landing_page, peer_evaluation, users, oauth, onboarding, rating, review_tasks, ai_templates

from app.database import engine, Base
from app import models

# Create database tables
Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[ 
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Avasara API",
    description="API for Avasara platform with peer evaluation system",
    version="1.0.0"
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Log request details
    logger.info(f"Request: {request.method} {request.url}")
    logger.info(f"Headers: {dict(request.headers)}")
    
    # Get request body if it exists
    try:
        body = await request.body()
        if body:
            logger.info(f"Body: {body.decode()}")
    except:
        pass
    
    # Time the request
    start_time = time.time()
    
    # Process the request
    response = await call_next(request)
    
    # Log response time
    process_time = time.time() - start_time
    logger.info(f"Response time: {process_time:.2f}s")
    logger.info(f"Response status: {response.status_code}")
    
    return response

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
         # Production frontend
        "http://localhost:3000",                 # Local development
        "https://theavasara.com",
        "https://www.theavasara.com",
    ],
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
app.include_router(users.router)
app.include_router(oauth.router)
app.include_router(onboarding.router)
app.include_router(rating.router)
app.include_router(review_tasks.router)
<<<<<<< HEAD
=======
app.include_router(ai_templates.router)
>>>>>>> 29211951d769e31797b4368958ca7c7c2797318b

@app.get("/")
async def root():
    return {
        "message": "Welcome to Avasara API",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
