import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import secrets
import os
from typing import Optional

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@avasara.com")
        self.app_url = os.getenv("APP_URL", "https://avasara-frontend.onrender.com")
        
    def generate_verification_token(self) -> str:
        """Generate a secure verification token"""
        return secrets.token_urlsafe(32)
    
    def get_verification_expiry(self) -> datetime:
        """Get expiry time for verification token (24 hours from now)"""
        return datetime.utcnow() + timedelta(hours=24)
    
    def send_verification_email(self, email: str, username: str, token: str) -> bool:
        """Send email verification email"""
        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Welcome to Avasara - Verify Your Email"
            msg["From"] = self.from_email
            msg["To"] = email
            
            # Verification URL
            verification_url = f"{self.app_url}/verify-email?token={token}"
            
            # HTML content
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to Avasara</title>
                <style>
                    body {{
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                        border-radius: 10px 10px 0 0;
                    }}
                    .content {{
                        background: #f8f9fa;
                        padding: 30px;
                        border-radius: 0 0 10px 10px;
                    }}
                    .button {{
                        display: inline-block;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px 30px;
                        text-decoration: none;
                        border-radius: 25px;
                        font-weight: bold;
                        margin: 20px 0;
                    }}
                    .footer {{
                        text-align: center;
                        margin-top: 30px;
                        color: #666;
                        font-size: 14px;
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🌟 Welcome to Avasara!</h1>
                    <p>Your journey to meaningful impact starts here</p>
                </div>
                <div class="content">
                    <h2>Hi {username},</h2>
                    <p>Thank you for joining the Avasara community! We're excited to have you on board.</p>
                    <p>To complete your registration and start contributing to meaningful projects, please verify your email address by clicking the button below:</p>
                    
                    <div style="text-align: center;">
                        <a href="{verification_url}" class="button">Verify Email Address</a>
                    </div>
                    
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #667eea;">{verification_url}</p>
                    
                    <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
                    
                    <p>Once verified, you'll be able to:</p>
                    <ul>
                        <li>Browse and apply for meaningful tasks</li>
                        <li>Connect with other community members</li>
                        <li>Build your portfolio and reputation</li>
                        <li>Make a real impact on innovative projects</li>
                    </ul>
                    
                    <p>If you didn't create an account with Avasara, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                    <p>Best regards,<br>The Avasara Team</p>
                    <p>Building a community of the people, by the people, for the people.</p>
                </div>
            </body>
            </html>
            """
            
            # Plain text content
            text_content = f"""
            Welcome to Avasara!
            
            Hi {username},
            
            Thank you for joining the Avasara community! We're excited to have you on board.
            
            To complete your registration and start contributing to meaningful projects, please verify your email address by visiting:
            
            {verification_url}
            
            This verification link will expire in 24 hours for security reasons.
            
            Once verified, you'll be able to browse and apply for meaningful tasks, connect with other community members, build your portfolio, and make a real impact on innovative projects.
            
            If you didn't create an account with Avasara, you can safely ignore this email.
            
            Best regards,
            The Avasara Team
            """
            
            # Attach parts
            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email
            if self.smtp_username and self.smtp_password:
                context = ssl.create_default_context()
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls(context=context)
                    server.login(self.smtp_username, self.smtp_password)
                    server.sendmail(self.from_email, email, msg.as_string())
                return True
            else:
                # For development, just print the email
                print(f"=== EMAIL VERIFICATION ===")
                print(f"To: {email}")
                print(f"Subject: Welcome to Avasara - Verify Your Email")
                print(f"Verification URL: {verification_url}")
                print(f"==========================")
                return True
                
        except Exception as e:
            print(f"Error sending verification email: {e}")
            return False
    
    def send_reset_password_email(self, email: str, username: str, token: str) -> bool:
        """Send password reset email"""
        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Avasara - Reset Your Password"
            msg["From"] = self.from_email
            msg["To"] = email
            
            # Reset URL
            reset_url = f"{self.app_url}/reset-password?token={token}"
            
            # HTML content
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Your Password</title>
                <style>
                    body {{
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                        border-radius: 10px 10px 0 0;
                    }}
                    .content {{
                        background: #f8f9fa;
                        padding: 30px;
                        border-radius: 0 0 10px 10px;
                    }}
                    .button {{
                        display: inline-block;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 15px 30px;
                        text-decoration: none;
                        border-radius: 25px;
                        font-weight: bold;
                        margin: 20px 0;
                    }}
                    .footer {{
                        text-align: center;
                        margin-top: 30px;
                        color: #666;
                        font-size: 14px;
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🔐 Reset Your Password</h1>
                    <p>Avasara Account Security</p>
                </div>
                <div class="content">
                    <h2>Hi {username},</h2>
                    <p>We received a request to reset your password for your Avasara account.</p>
                    <p>Click the button below to create a new password:</p>
                    
                    <div style="text-align: center;">
                        <a href="{reset_url}" class="button">Reset Password</a>
                    </div>
                    
                    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #667eea;">{reset_url}</p>
                    
                    <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
                    
                    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                </div>
                <div class="footer">
                    <p>Best regards,<br>The Avasara Team</p>
                </div>
            </body>
            </html>
            """
            
            # Plain text content
            text_content = f"""
            Reset Your Password
            
            Hi {username},
            
            We received a request to reset your password for your Avasara account.
            
            Click the link below to create a new password:
            
            {reset_url}
            
            This link will expire in 1 hour for security reasons.
            
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            
            Best regards,
            The Avasara Team
            """
            
            # Attach parts
            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email
            if self.smtp_username and self.smtp_password:
                context = ssl.create_default_context()
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls(context=context)
                    server.login(self.smtp_username, self.smtp_password)
                    server.sendmail(self.from_email, email, msg.as_string())
                return True
            else:
                # For development, just print the email
                print(f"=== PASSWORD RESET EMAIL ===")
                print(f"To: {email}")
                print(f"Subject: Avasara - Reset Your Password")
                print(f"Reset URL: {reset_url}")
                print(f"============================")
                return True
                
        except Exception as e:
            print(f"Error sending reset password email: {e}")
            return False 