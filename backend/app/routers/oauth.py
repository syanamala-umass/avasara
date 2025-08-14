from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.oauth import oauth_service
from app.core.security import create_access_token
from app.config import settings
from app.services.login_logger import LoginLogger
from typing import Optional
from pydantic import BaseModel

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
    print(f"Generated Google OAuth URL: {auth_url}")
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
async def google_callback(code: str, db: Session = Depends(get_db), request: Request = None):
    """Handle Google OAuth callback"""
    try:
        print(f"Google OAuth callback received with code: {code[:10]}...")
        
        # Get client IP and user agent
        client_ip = request.client.host if request else None
        user_agent = request.headers.get("user-agent") if request else None
        
        # Exchange code for access token
        access_token = await oauth_service.exchange_google_code(code)
        if not access_token:
            print("Failed to exchange code for access token")
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
        
        # Log successful OAuth login
        LoginLogger.log_login(
            db=db,
            user_id=user["id"],
            login_method="oauth_google",
            ip_address=client_ip,
            user_agent=user_agent,
            success="success"
        )
        
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

class OAuthTokenRequest(BaseModel):
    provider: str
    code: str

@router.post("/token")
async def get_oauth_token(request: OAuthTokenRequest, db: Session = Depends(get_db)):
    """Get OAuth token for a specific provider (alternative to callback)"""
    try:
        # Get client IP and user agent for logging
        client_ip = http_request.client.host if http_request else None
        user_agent = http_request.headers.get("user-agent") if http_request else None
        
        print(f"Processing OAuth token request for provider: {request.provider}")
        print(f"Code received: {request.code[:10]}...")
        
        if request.provider == "google":
            access_token = await oauth_service.exchange_google_code(request.code)
            user_info = await oauth_service.get_google_user_info(access_token)
        elif request.provider == "linkedin":
            access_token = await oauth_service.exchange_linkedin_code(request.code)
            user_info = await oauth_service.get_linkedin_user_info(access_token)
        elif request.provider == "github":
            access_token = await oauth_service.exchange_github_code(request.code)
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
        
        print(f"User info received: {user_info.get('email', 'No email')}")
        print(f"User info keys: {user_info.keys()}")
        
        # Process user
        user = oauth_service.process_oauth_user(db, user_info, request.provider)
        print(f"User processed: {user}")
        
        # Log successful OAuth login
        LoginLogger.log_login(
            db=db,
            user_id=user["id"],
            login_method=f"oauth_{request.provider.lower()}",
            ip_address=client_ip,
            user_agent=user_agent,
            success="success"
        )
        
        # Create JWT token
        jwt_token = create_access_token(data={"sub": user["email"]})
        
        print(f"JWT token created for user: {user['email']}")
        
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user": user,
            "provider": request.provider
        }
        
    except Exception as e:
        print(f"Error in OAuth token endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        ) 