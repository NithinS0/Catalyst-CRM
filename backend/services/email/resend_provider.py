import json
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from backend.services.email.base import EmailProvider, EmailResult, BulkEmailResult, DeliveryStatus
from backend.config import settings

class ResendProvider(EmailProvider):
    def __init__(self, api_key: Optional[str] = None, default_from: Optional[str] = None, default_reply_to: Optional[str] = None):
        self.api_key = api_key or settings.RESEND_API_KEY
        self.default_from = default_from or settings.EMAIL_FROM or "Catalyst <onboarding@resend.dev>"
        self.default_reply_to = default_reply_to or settings.EMAIL_REPLY_TO or None
        self.endpoint = "https://api.resend.com/emails"

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip() and not self.api_key.startswith("mock-"))

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
                error_message="Resend API key is not configured. Add RESEND_API_KEY to backend/.env or configure Email in Settings."
            )

        sender = from_email or self.default_from
        reply = reply_to or self.default_reply_to

        # Ensure sender has formatted display name
        from_name = getattr(settings, "EMAIL_FROM_NAME", "Catalyst CRM")
        if sender and "<" not in sender and "@" in sender:
            sender = f"{from_name} <{sender}>"

        # Generate HTML from plain text if not explicitly provided
        if not html_body:
            escaped_body = body.replace("\n", "<br/>")
            html_body = f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2B2B2B; line-height: 1.6;">
                <div style="margin-bottom: 24px;">
                    <span style="font-weight: 700; font-size: 16px; letter-spacing: -0.02em; color: #2B2B2B;">CATALYST</span>
                </div>
                <div style="background-color: #FFFFFF; border: 1px solid #D4D4D4; border-radius: 12px; padding: 24px;">
                    <div style="font-size: 15px; color: #2B2B2B; white-space: pre-wrap;">{escaped_body}</div>
                </div>
                <div style="margin-top: 24px; font-size: 12px; color: #B3B3B3; text-align: center;">
                    Delivered via Catalyst AI-Native CRM.
                </div>
            </div>
            """

        payload: Dict[str, Any] = {
            "from": sender,
            "to": [to_email],
            "subject": subject,
            "text": body,
            "html": html_body
        }
        if reply:
            payload["reply_to"] = reply
        if headers:
            payload["headers"] = headers

        try:
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                self.endpoint,
                data=data,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "CatalystCRM/2.0 (resend-integration)"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=15) as response:
                resp_data = json.loads(response.read().decode("utf-8"))
                msg_id = resp_data.get("id")
                return EmailResult(
                    success=True,
                    provider_message_id=msg_id,
                    status="sent",
                    details=resp_data
                )
        except urllib.error.HTTPError as e:
            err_text = e.read().decode("utf-8")
            try:
                err_json = json.loads(err_text)
                detail = err_json.get("message") or err_text
            except Exception:
                detail = err_text

            # Provide clear guidance on Resend trial / domain verification constraints
            if e.code == 403 and "testing emails to your own email address" in detail.lower():
                detail = f"Resend Sandbox Restriction: In unverified testing mode, Resend only delivers to your registered account owner email. {detail}"

            return EmailResult(
                success=False,
                status="failed",
                error_message=f"Resend HTTP {e.code}: {detail}",
                details={"status_code": e.code, "raw_error": detail}
            )
        except Exception as exc:
            return EmailResult(
                success=False,
                status="failed",
                error_message=f"Email dispatch error: {str(exc)}"
            )

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
        import time
        from datetime import datetime, timezone
        from backend.database.supabase import get_supabase
        from backend.utils.tenant import get_current_company_id

        cid = company_id or get_current_company_id()
        key = idempotency_key or f"camp_{campaign_id}_cust_{customer_id}"
        supabase = get_supabase()

        # 1. Idempotency Check: Don't resend if already sent or delivered
        try:
            chk = supabase.table("campaign_recipients").select("*").eq("idempotency_key", key).execute()
            if chk.data:
                existing = chk.data[0]
                if existing.get("status") in ("sent", "delivered", "opened", "clicked"):
                    return EmailResult(
                        success=True,
                        provider_message_id=existing.get("provider_message_id"),
                        status=existing.get("status"),
                        details={"idempotent_skip": True, "idempotency_key": key}
                    )
        except Exception as e:
            print(f"[ResendProvider] Idempotency pre-check warning: {e}")

        # 2. Track Recipient as 'sending'
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
        except Exception as e:
            print(f"[ResendProvider] Recipient tracking initiation warning: {e}")

        # 3. Dispatch via Resend with exponential backoff for transient errors (429, 5xx)
        max_retries = 2
        send_result = None
        for attempt in range(max_retries + 1):
            send_result = self.send_email(
                to_email=to_email,
                subject=subject,
                body=body,
                html_body=html_body,
                from_email=from_email,
                reply_to=reply_to,
                headers={"X-Entity-Ref-ID": key}
            )
            if send_result.success:
                break
            
            # Check if failure is permanent (never retry 4xx errors except 429 rate limit)
            status_code = (send_result.details or {}).get("status_code")
            if status_code and 400 <= status_code < 500 and status_code != 429:
                break

            err_lower = (send_result.error_message or "").lower()
            if any(code in err_lower for code in ["400", "401", "403", "404", "422", "not configured", "unauthorized", "invalid", "sandbox restriction"]):
                break

            if attempt < max_retries:
                time.sleep(1.0 * (attempt + 1))

        # 4. Finalize Recipient Record
        final_now = datetime.now(timezone.utc).isoformat()
        try:
            if send_result and send_result.success:
                supabase.table("campaign_recipients").update({
                    "status": "sent",
                    "provider_message_id": send_result.provider_message_id,
                    "sent_at": final_now
                }).eq("idempotency_key", key).execute()
            else:
                err_msg = send_result.error_message if send_result else "Unknown dispatch error"
                supabase.table("campaign_recipients").update({
                    "status": "failed",
                    "failed_at": final_now,
                    "error_message": err_msg
                }).eq("idempotency_key", key).execute()
        except Exception as e:
            print(f"[ResendProvider] Recipient tracking finalization warning: {e}")

        return send_result

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

            # Render template with item context
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
        subj = subject or "Catalyst CRM: Test Email Verification"
        content = body or "This is a test email sent from Catalyst CRM to verify your email integration settings.\n\nYour email channel is active and configured correctly."
        return self.send_email(to_email=to_email, subject=subj, body=content)

    def get_delivery_status(self, provider_message_id: str) -> DeliveryStatus:
        if not self.is_configured() or not provider_message_id:
            return DeliveryStatus(status="unknown", provider_message_id=provider_message_id)

        try:
            req = urllib.request.Request(
                f"{self.endpoint}/{provider_message_id}",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "User-Agent": "CatalystCRM/2.0 (resend-integration)"
                },
                method="GET"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                resp_data = json.loads(response.read().decode("utf-8"))
                last_event = resp_data.get("last_event", "sent")
                return DeliveryStatus(
                    status=last_event,
                    provider_message_id=provider_message_id,
                    timestamp=resp_data.get("created_at")
                )
        except Exception as e:
            return DeliveryStatus(status="sent", provider_message_id=provider_message_id, error=str(e))
