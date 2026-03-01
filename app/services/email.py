from __future__ import annotations

from decimal import Decimal
from typing import Optional

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import Config, logger

# EMAIL SERVICE
# ============================================================================

class EmailService:
    """Email service for sending notifications"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._enabled = Config.ENABLE_EMAIL
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None
    ) -> bool:
        """Send an email"""
        if not self._enabled:
            logger.warning("Email service is disabled")
            return False
        
        try:
            import aiosmtplib
            
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = f"{from_name or Config.SMTP_FROM_NAME} <{from_email or Config.SMTP_FROM_EMAIL}>"
            message['To'] = to_email
            
            # Add plain text version
            part1 = MIMEText(body, 'plain')
            message.attach(part1)
            
            # Add HTML version if provided
            if html_body:
                part2 = MIMEText(html_body, 'html')
                message.attach(part2)
            
            # Send email
            await aiosmtplib.send(
                message,
                hostname=Config.SMTP_HOST,
                port=Config.SMTP_PORT,
                username=Config.SMTP_USERNAME,
                password=Config.SMTP_PASSWORD,
                use_tls=Config.SMTP_USE_TLS
            )
            
            logger.info(f"Email sent to {to_email}: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    async def send_welcome_email(self, user_email: str, username: str) -> bool:
        """Send welcome email to new user"""
        subject = f"Welcome to {Config.APP_NAME}, {username}!"
        
        body = f"""
        Welcome to {Config.APP_NAME}!
        
        Your account has been created successfully. You can now:
        - Browse our hardware catalog
        - Add items to your cart
        - Place orders
        - Track your shipments
        
        Your starting balance: ${Config.STARTING_BALANCE}
        
        If you have any questions, please contact our support team.
        
        Best regards,
        The {Config.APP_NAME} Team
        """
        
        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #00ff9d, #00bcd4); color: black; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .button {{ display: inline-block; padding: 10px 20px; background: #00ff9d; color: black; text-decoration: none; border-radius: 4px; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{Config.APP_NAME}</h1>
                </div>
                <div class="content">
                    <h2>Welcome, {username}!</h2>
                    <p>Your account has been created successfully. You can now:</p>
                    <ul>
                        <li>Browse our hardware catalog</li>
                        <li>Add items to your cart</li>
                        <li>Place orders</li>
                        <li>Track your shipments</li>
                    </ul>
                    <p><strong>Your starting balance: ${Config.STARTING_BALANCE}</strong></p>
                    <p>
                        <a href="http://localhost:8080" class="button">Visit Store</a>
                    </p>
                    <p>If you have any questions, please contact our support team.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 {Config.APP_NAME}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(user_email, subject, body, html_body)
    
    async def send_order_confirmation(self, user_email: str, order_number: str, total: Decimal) -> bool:
        """Send order confirmation email"""
        subject = f"Order Confirmation #{order_number}"
        
        body = f"""
        Thank you for your order!
        
        Order Number: {order_number}
        Total Amount: ${total}
        
        Your order has been received and is being processed.
        You will receive another email when your order ships.
        
        You can track your order status in your account dashboard.
        
        Thank you for shopping with {Config.APP_NAME}!
        """
        
        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #00ff9d, #00bcd4); color: black; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .order-details {{ background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0; }}
                .button {{ display: inline-block; padding: 10px 20px; background: #00ff9d; color: black; text-decoration: none; border-radius: 4px; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{Config.APP_NAME}</h1>
                </div>
                <div class="content">
                    <h2>Thank you for your order!</h2>
                    <div class="order-details">
                        <p><strong>Order Number:</strong> {order_number}</p>
                        <p><strong>Total Amount:</strong> ${total}</p>
                    </div>
                    <p>Your order has been received and is being processed.</p>
                    <p>You will receive another email when your order ships.</p>
                    <p>
                        <a href="http://localhost:8080/orders" class="button">View Order</a>
                    </p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 {Config.APP_NAME}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(user_email, subject, body, html_body)
    
    async def send_password_reset(self, user_email: str, reset_token: str) -> bool:
        """Send password reset email"""
        subject = "Password Reset Request"
        
        reset_link = f"http://localhost:8080/reset-password?token={reset_token}"
        
        body = f"""
        Password Reset Request
        
        You recently requested to reset your password for your {Config.APP_NAME} account.
        Click the link below to reset it. This link will expire in 24 hours.
        
        {reset_link}
        
        If you did not request a password reset, please ignore this email or contact support if you have concerns.
        
        This is an automated message, please do not reply.
        """
        
        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #00ff9d, #00bcd4); color: black; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .button {{ display: inline-block; padding: 10px 20px; background: #00ff9d; color: black; text-decoration: none; border-radius: 4px; }}
                .warning {{ background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 10px; border-radius: 4px; margin: 20px 0; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{Config.APP_NAME}</h1>
                </div>
                <div class="content">
                    <h2>Password Reset Request</h2>
                    <p>You recently requested to reset your password for your {Config.APP_NAME} account.</p>
                    <p>Click the button below to reset it. This link will expire in 24 hours.</p>
                    <p style="text-align: center;">
                        <a href="{reset_link}" class="button">Reset Password</a>
                    </p>
                    <div class="warning">
                        <p><strong>Didn't request this?</strong></p>
                        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                    </div>
                </div>
                <div class="footer">
                    <p>This is an automated message, please do not reply.</p>
                    <p>&copy; 2024 {Config.APP_NAME}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(user_email, subject, body, html_body)

# ============================================================================
