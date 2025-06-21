from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# Create the engine correctly based on database type
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(settings.DATABASE_URL)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class for models
Base = declarative_base()

# Dependency - for FastAPI routes to get a database session
def get_db():
    db = SessionLocal()
    try:
        logger.info("Database session created")
        yield db
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        logger.error("Traceback:", exc_info=True)
        raise
    finally:
        logger.info("Closing database session")
        db.close()
