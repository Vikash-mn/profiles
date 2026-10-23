from __future__ import annotations

from decimal import Decimal
from html import escape
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

    @staticmethod
    def _store_url() -> str:
        if not Config.PUBLIC_SITE_URL:
            return ""
        return f"{Config.PUBLIC_SITE_URL}/store.html"
    
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
        subject = f"Your {Config.APP_NAME} account is ready"
        store_url = self._store_url()
        store_text = f"\nStorefront: {store_url}\n" if store_url else ""
        store_link = (
            f'<p><a href="{escape(store_url, quote=True)}">Open the storefront</a></p>'
            if store_url
            else ""
        )
        safe_username = escape(username)

        body = f"""
        Your account has been created.
        Use the storefront sign-in page to access your account when the storefront is available.
        {store_text}
        This email does not confirm any order or payment.
        """

        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #202b25; background: #f4f1e8; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #243c30; color: #fbf9f3; padding: 20px; }}
                .content {{ padding: 20px; }}
                a {{ color: #243c30; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #c9cec5; color: #526158; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <header class="header"><h1>{Config.APP_NAME}</h1></header>
                <div class="content">
                    <h2>Account created</h2>
                    <p>Hello {safe_username}. Your account was created.</p>
                    {store_link}
                    <p>This message does not confirm an order or payment.</p>
                </div>
                <footer class="footer">{Config.APP_NAME}</footer>
            </div>
        </body>
        </html>
        """

        return await self.send_email(user_email, subject, body, html_body)
    
    async def send_order_confirmation(self, user_email: str, order_number: str, total: Decimal) -> bool:
        """Send a receipt for an order request."""
        subject = f"Order request received #{order_number}"
        store_url = self._store_url()
        store_text = f"\nStorefront: {store_url}\n" if store_url else ""
        store_link = (
            f'<p><a href="{escape(store_url, quote=True)}">Open storefront order history</a></p>'
            if store_url
            else ""
        )
        safe_order_number = escape(order_number)

        body = f"""
        Your order request was submitted.
        Reference: {order_number}
        Total shown: ${total}
        {store_text}
        This message confirms submission only. It does not confirm stock, payment, shipping, or acceptance.
        Confirm the request and any payment instructions directly with the operator.
        """

        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #202b25; background: #f4f1e8; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #243c30; color: #fbf9f3; padding: 20px; }}
                .content {{ padding: 20px; }}
                .order-details {{ background: #e9e8df; padding: 15px; border-radius: 3px; margin: 20px 0; }}
                a {{ color: #243c30; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #c9cec5; color: #526158; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <header class="header"><h1>{Config.APP_NAME}</h1></header>
                <div class="content">
                    <h2>Order request received</h2>
                    <div class="order-details">
                        <p><strong>Reference:</strong> {safe_order_number}</p>
                        <p><strong>Total Amount:</strong> ${total}</p>
                    </div>
                    <p>This message confirms submission only. It does not confirm stock, payment, shipping, or acceptance.</p>
                    <p>Confirm the request and any payment instructions directly with the operator.</p>
                    {store_link}
                </div>
                <footer class="footer">{Config.APP_NAME}</footer>
            </div>
        </body>
        </html>
        """

        return await self.send_email(user_email, subject, body, html_body)
    
    async def send_password_reset(self, user_email: str, reset_token: str) -> bool:
        """Reject reset mail until a matching public reset flow exists."""
        logger.warning("Password reset email skipped: no reset page or API route is configured")
        return False

# ============================================================================
