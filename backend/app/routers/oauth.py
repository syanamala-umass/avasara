from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.oauth import oauth_service
from app.core.security import create_access_token
from app.config import settings
from typing import Optional

router = APIRouter(
    prefix="/oauth",
    tags=["oauth"],
    responses={401: {"description": "Unauthorized"}},
)

@router.get("/google/authorize")
async def google_authorize():
    """Generate Google OAuth authorization URL"""
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        "response_type=code&"
        "scope=openid email profile&"
        f"redirect_uri={settings.GOOGLE_REDIRECT_URI}&"
        "access_type=offline"
    )
    return {"auth_url": auth_url}

@router.get("/linkedin/authorize")
async def linkedin_authorize():
    """Generate LinkedIn OAuth authorization URL"""
    auth_url = (
        "https://www.linkedin.com/oauth/v2/authorization?"
        f"client_id={settings.LINKEDIN_CLIENT_ID}&"
        "response_type=code&"
        "scope=r_liteprofile r_emailaddress&"
        f"redirect_uri={settings.LINKEDIN_REDIRECT_URI}"
    )
    return {"auth_url": auth_url}

@router.get("/github/authorize")
async def github_authorize():
    """Generate GitHub OAuth authorization URL"""
    auth_url = (
        "https://github.com/login/oauth/authorize?"
        f"client_id={settings.GITHUB_CLIENT_ID}&"
        "scope=user:email&"
        f"redirect_uri={settings.GITHUB_REDIRECT_URI}"
    )
    return {"auth_url": auth_url}

@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    try:
        # Exchange code for access token
        access_token = await oauth_service.exchange_google_code(code)
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange code for access token"
            )
        
        # Get user information
        user_info = await oauth_service.get_google_user_info(access_token)
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user information from Google"
            )
        
        # Process user (create or get existing)
        user = oauth_service.process_oauth_user(db, user_info, "Google")
        
        # Create JWT token
        jwt_token = create_access_token(data={"sub": user["email"]})
        
        # Redirect to frontend with token
        redirect_url = f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}&provider=google"
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        error_url = f"{settings.FRONTEND_URL}/auth/error?message={str(e)}"
        return RedirectResponse(url=error_url)

@router.get("/linkedin/callback")
async def linkedin_callback(code: str, db: Session = Depends(get_db)):
    """Handle LinkedIn OAuth callback"""
    try:
        # Exchange code for access token
        access_token = await oauth_service.exchange_linkedin_code(code)
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange code for access token"
            )
        
        # Get user information
        user_info = await oauth_service.get_linkedin_user_info(access_token)
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user information from LinkedIn"
            )
        
        # Process user (create or get existing)
        user = oauth_service.process_oauth_user(db, user_info, "LinkedIn")
        
        # Create JWT token
        jwt_token = create_access_token(data={"sub": user["email"]})
        
        # Redirect to frontend with token
        redirect_url = f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}&provider=linkedin"
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        error_url = f"{settings.FRONTEND_URL}/auth/error?message={str(e)}"
        return RedirectResponse(url=error_url)

@router.get("/github/callback")
async def github_callback(code: str, db: Session = Depends(get_db)):
    """Handle GitHub OAuth callback"""
    try:
        # Exchange code for access token
        access_token = await oauth_service.exchange_github_code(code)
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange code for access token"
            )
        
        # Get user information
        user_info = await oauth_service.get_github_user_info(access_token)
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user information from GitHub"
            )
        
        # Process user (create or get existing)
        user = oauth_service.process_oauth_user(db, user_info, "GitHub")
        
        # Create JWT token
        jwt_token = create_access_token(data={"sub": user["email"]})
        
        # Redirect to frontend with token
        redirect_url = f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}&provider=github"
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        error_url = f"{settings.FRONTEND_URL}/auth/error?message={str(e)}"
        return RedirectResponse(url=error_url)

@router.post("/token")
async def get_oauth_token(provider: str, code: str, db: Session = Depends(get_db)):
    """Get OAuth token for a specific provider (alternative to callback)"""
    try:
        if provider == "google":
            access_token = await oauth_service.exchange_google_code(code)
            user_info = await oauth_service.get_google_user_info(access_token)
        elif provider == "linkedin":
            access_token = await oauth_service.exchange_linkedin_code(code)
            user_info = await oauth_service.get_linkedin_user_info(access_token)
        elif provider == "github":
            access_token = await oauth_service.exchange_github_code(code)
            user_info = await oauth_service.get_github_user_info(access_token)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported OAuth provider"
            )
        
        if not access_token or not user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to authenticate with OAuth provider"
            )
        
        # Process user
        user = oauth_service.process_oauth_user(db, user_info, provider)
        
        # Create JWT token
        jwt_token = create_access_token(data={"sub": user["email"]})
        
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user": user,
            "provider": provider
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) 