import httpx
from typing import Optional, Dict, Any
from app.config import settings
from app.crud.user import get_user_by_email, create_oauth_user
from app.schemas.user import UserCreate
from app.core.security import create_access_token
from sqlalchemy.orm import Session
from app.crud.user import get_user_by_username


class OAuthService:
    """Service for handling OAuth authentication with Google, LinkedIn, and GitHub"""
    
    @staticmethod
    async def get_google_user_info(access_token: str) -> Optional[Dict[str, Any]]:
        """Get user information from Google using access token"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if response.status_code == 200:
                return response.json()
        return None
    
    @staticmethod
    async def get_linkedin_user_info(access_token: str) -> Optional[Dict[str, Any]]:
        """Get user information from LinkedIn using access token"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.linkedin.com/v2/me",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if response.status_code == 200:
                user_data = response.json()
                # Get email address
                email_response = await client.get(
                    "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if email_response.status_code == 200:
                    email_data = email_response.json()
                    if email_data.get("elements"):
                        user_data["email"] = email_data["elements"][0]["handle~"]["emailAddress"]
                return user_data
        return None
    
    @staticmethod
    async def get_github_user_info(access_token: str) -> Optional[Dict[str, Any]]:
        """Get user information from GitHub using access token"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            if response.status_code == 200:
                return response.json()
        return None
    
    @staticmethod
    async def exchange_google_code(code: str) -> Optional[str]:
        """Exchange authorization code for Google access token"""
        print(f"Exchanging Google code with client_id: {settings.GOOGLE_CLIENT_ID}")
        print(f"Redirect URI: {settings.GOOGLE_REDIRECT_URI}")
        print(f"Code length: {len(code)}")
        
        async with httpx.AsyncClient() as client:
            token_data = {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.GOOGLE_REDIRECT_URI
            }
            print(f"Token exchange data: {token_data}")
            
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data=token_data
            )
            print(f"Google token exchange response status: {response.status_code}")
            if response.status_code != 200:
                print(f"Google token exchange error: {response.text}")
            
            if response.status_code == 200:
                token_response = response.json()
                print(f"Token response keys: {token_response.keys()}")
                return token_response.get("access_token")
        return None
    
    @staticmethod
    async def exchange_linkedin_code(code: str) -> Optional[str]:
        """Exchange authorization code for LinkedIn access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://www.linkedin.com/oauth/v2/accessToken",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "client_id": settings.LINKEDIN_CLIENT_ID,
                    "client_secret": settings.LINKEDIN_CLIENT_SECRET,
                    "redirect_uri": settings.LINKEDIN_REDIRECT_URI
                }
            )
            if response.status_code == 200:
                return response.json().get("access_token")
        return None
    
    @staticmethod
    async def exchange_github_code(code: str) -> Optional[str]:
        """Exchange authorization code for GitHub access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "code": code
                },
                headers={"Accept": "application/json"}
            )
            if response.status_code == 200:
                return response.json().get("access_token")
        return None
    
    @staticmethod
    def process_oauth_user(db: Session, user_info: Dict[str, Any], provider: str) -> Dict[str, Any]:
        """Process OAuth user information and create/update user in database"""
        email = user_info.get("email")
        if not email:
            raise ValueError(f"No email provided by {provider}")
        
        # Check if user already exists
        existing_user = get_user_by_email(db, email)
        if existing_user:
            # Add flag to indicate this is an existing user
            existing_user["is_new_user"] = False
            return existing_user
        
        # Extract user information based on provider
        if provider == "Google":
            username = email.split("@")[0]
            full_name = user_info.get("name", "")
            oauth_id = user_info.get("id")
        elif provider == "LinkedIn":
            username = user_info.get("localizedFirstName", "").lower() + user_info.get("localizedLastName", "").lower()
            full_name = f"{user_info.get('localizedFirstName', '')} {user_info.get('localizedLastName', '')}".strip()
            oauth_id = user_info.get("id")
        elif provider == "GitHub":
            username = user_info.get("login", email.split("@")[0])
            full_name = user_info.get("name", "")
            oauth_id = str(user_info.get("id"))
        else:
            username = email.split("@")[0]
            full_name = user_info.get("name", "")
            oauth_id = str(user_info.get("id", ""))
        
        # Use first part of email as username
       
        print(f"Initial username from email: {username}")
        
        # Ensure username is unique by appending integer if needed
        base_username = username
        counter = 1
        while get_user_by_username(db, username):
            print(f"Username '{username}' already exists, trying next...")
            username = f"{base_username}{counter}"
            counter += 1
        
        print(f"Final unique username: {username}")
        
        # Create OAuth user
        new_user = create_oauth_user(
            db=db,
            email=email,
            username=username,
            full_name=full_name,
            oauth_provider=provider.lower(),
            oauth_id=oauth_id
        )
        
        # Add flag to indicate this is a new user
        new_user["is_new_user"] = True
        
        return new_user


oauth_service = OAuthService() 