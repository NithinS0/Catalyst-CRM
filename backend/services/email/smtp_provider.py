import smtplib
import uuid
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional
from backend.services.email.base import EmailProvider, EmailResult, BulkEmailResult, DeliveryStatus
from backend.config import settings

class SMTPProvider(EmailProvider):
    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        use_tls: Optional[bool] = None,
        default_from: Optional[str] = None
    ):
        self.host = host or settings.SMTP_HOST
        self.port = port or settings.SMTP_PORT or 587
        self.username = username or settings.SMTP_USERNAME
        self.password = password or settings.SMTP_PASSWORD
        self.use_tls = use_tls if use_tls is not None else settings.SMTP_USE_TLS
        self.default_from = default_from or settings.EMAIL_FROM or "Catalyst <no-reply@catalystcrm.com>"

    def is_configured(self) -> bool:
        return bool(self.host and self.host.strip())

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
        if not self.is_configured():
            return EmailResult(
                success=False,
                status="failed",
                error_message="SMTP server is not configured. Configure SMTP in backend/.env or Settings."
            )

        sender = from_email or self.default_from
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender
        msg["To"] = to_email
        if reply_to:
            msg["Reply-To"] = reply_to

        msg_id = f"smtp-{uuid.uuid4().hex}"
        msg["Message-ID"] = f"<{msg_id}@catalystcrm.com>"

        if headers:
            for k, v in headers.items():
                msg[k] = v

        msg.attach(MIMEText(body, "plain"))
        if html_body:
            msg.attach(MIMEText(html_body, "html"))

        try:
            server = smtplib.SMTP(self.host, int(self.port), timeout=15)
            if self.use_tls:
                server.starttls()
            if self.username and self.password:
                server.login(self.username, self.password)

            server.sendmail(sender, [to_email], msg.as_string())
            server.quit()

            return EmailResult(
                success=True,
                provider_message_id=msg_id,
                status="sent"
            )
        except Exception as e:
            return EmailResult(
                success=False,
                status="failed",
                error_message=f"SMTP dispatch failed: {str(e)}"
            )

    def send_bulk_email(
        self,
        recipients: List[Dict[str, Any]],
        subject: str,
        template: str,
        from_email: Optional[str] = None,
        reply_to: Optional[str] = None
    ) -> BulkEmailResult:
        sent = 0
        failed = 0
        results: List[EmailResult] = []

        for item in recipients:
            to_email = item.get("email")
            if not to_email:
                failed += 1
                results.append(EmailResult(success=False, status="failed", error_message="Recipient missing email"))
                continue

            body = template
            for k, v in item.items():
                body = body.replace("{{" + k + "}}", str(v or ""))

            res = self.send_email(
                to_email=to_email,
                subject=subject,
                body=body,
                from_email=from_email,
                reply_to=reply_to
            )
            if res.success:
                sent += 1
            else:
                failed += 1
            results.append(res)

        return BulkEmailResult(total=len(recipients), sent=sent, failed=failed, results=results)

    def send_test_email(
        self,
        to_email: str,
        subject: Optional[str] = None,
        body: Optional[str] = None
    ) -> EmailResult:
        subj = subject or "Catalyst CRM: SMTP Test Verification"
        content = body or "This is a test email sent from Catalyst CRM to verify your SMTP integration."
        return self.send_email(to_email=to_email, subject=subj, body=content)

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
        from datetime import datetime, timezone
        from backend.database.supabase import get_supabase
        from backend.utils.tenant import get_current_company_id

        cid = company_id or get_current_company_id()
        key = idempotency_key or f"camp_{campaign_id}_cust_{customer_id}"
        supabase = get_supabase()

        try:
            chk = supabase.table("campaign_recipients").select("*").eq("idempotency_key", key).execute()
            if chk.data and chk.data[0].get("status") in ("sent", "delivered", "opened", "clicked"):
                return EmailResult(
                    success=True,
                    provider_message_id=chk.data[0].get("provider_message_id"),
                    status=chk.data[0].get("status"),
                    details={"idempotent_skip": True, "idempotency_key": key}
                )
        except Exception:
            pass

        now_iso = datetime.now(timezone.utc).isoformat()
        try:
            supabase.table("campaign_recipients").upsert({
                "company_id": cid,
                "campaign_id": campaign_id,
                "customer_id": customer_id,
                "email": to_email,
                "status": "sending",
                "idempotency_key": key,
                "created_at": now_iso
            }, on_conflict="idempotency_key").execute()
        except Exception:
            pass

        res = self.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
            html_body=html_body,
            from_email=from_email,
            reply_to=reply_to
        )

        final_now = datetime.now(timezone.utc).isoformat()
        try:
            if res.success:
                supabase.table("campaign_recipients").update({
                    "status": "sent",
                    "provider_message_id": res.provider_message_id,
                    "sent_at": final_now
                }).eq("idempotency_key", key).execute()
            else:
                supabase.table("campaign_recipients").update({
                    "status": "failed",
                    "failed_at": final_now,
                    "error_message": res.error_message
                }).eq("idempotency_key", key).execute()
        except Exception:
            pass

        return res

    def get_delivery_status(self, provider_message_id: str) -> DeliveryStatus:
        return DeliveryStatus(status="sent", provider_message_id=provider_message_id)
