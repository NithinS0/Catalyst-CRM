from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from abc import ABC, abstractmethod

class EmailResult(BaseModel):
    success: bool
    provider_message_id: Optional[str] = None
    status: str # "sent", "failed", "simulated"
    error_message: Optional[str] = None
    details: Dict[str, Any] = {}

class BulkEmailResult(BaseModel):
    total: int
    sent: int
    failed: int
    results: List[EmailResult] = []

class DeliveryStatus(BaseModel):
    status: str # "sent", "delivered", "opened", "clicked", "bounced", "failed"
    provider_message_id: str
    timestamp: Optional[str] = None
    error: Optional[str] = None

class EmailProvider(ABC):
    @abstractmethod
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        from_email: Optional[str] = None,
        reply_to: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> EmailResult:
        """Send a single email message."""
        pass

    @abstractmethod
    def send_bulk_email(
        self,
        recipients: List[Dict[str, Any]],
        subject: str,
        template: str,
        from_email: Optional[str] = None,
        reply_to: Optional[str] = None
    ) -> BulkEmailResult:
        """Send bulk emails with context template substitution."""
        pass

    @abstractmethod
    def send_test_email(
        self,
        to_email: str,
        subject: Optional[str] = None,
        body: Optional[str] = None
    ) -> EmailResult:
        """Send a test email to verify configuration."""
        pass

    @abstractmethod
    def send_campaign_email(
        self,
        campaign_id: str,
        customer_id: str,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        from_email: Optional[str] = None,
        reply_to: Optional[str] = None,
        company_id: Optional[str] = None,
        idempotency_key: Optional[str] = None
    ) -> EmailResult:
        """Send an individualized campaign email with idempotency and recipient tracking."""
        pass

    @abstractmethod
    def get_delivery_status(self, provider_message_id: str) -> DeliveryStatus:
        """Retrieve latest delivery status from provider if supported."""
        pass
