from backend.services.email.base import EmailProvider, EmailResult, BulkEmailResult, DeliveryStatus
from backend.services.email.factory import get_email_provider
from backend.services.email.resend_provider import ResendProvider
from backend.services.email.smtp_provider import SMTPProvider

__all__ = [
    "EmailProvider",
    "EmailResult",
    "BulkEmailResult",
    "DeliveryStatus",
    "get_email_provider",
    "ResendProvider",
    "SMTPProvider"
]
