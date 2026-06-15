import logging
import db
from callbacks.sender import send_webhook_callback_with_retry
from simulation.delays import wait_simulation_delay
from simulation.outcomes import (
    should_fail_send,
    should_fail_delivery,
    should_open,
    should_read,
    should_click,
    should_convert
)

logger = logging.getLogger("channel-service-processor")

def simulate_delivery_flow(
    communication_id: str,
    recipient: str,
    channel: str,
    message: str,
    backend_url: str
):
    """
    Runs in the background. Simulates delays and failures,
    generating events sequentially: sent -> delivered -> opened -> read -> clicked -> converted
    Sends callbacks for each event to the CRM backend webhook.
    """
    # 0. Initial Queueing
    db.log_event(communication_id, recipient, channel, message, "queued")
    send_webhook_callback_with_retry(communication_id, recipient, channel, message, "queued", backend_url)

    # 1. Sent Simulation
    wait_simulation_delay(0.5, 1.5)
    if should_fail_send():
        db.log_event(communication_id, recipient, channel, message, "failed")
        send_webhook_callback_with_retry(communication_id, recipient, channel, message, "failed", backend_url)
        return

    db.log_event(communication_id, recipient, channel, message, "sent")
    send_webhook_callback_with_retry(communication_id, recipient, channel, message, "sent", backend_url)

    # 2. Delivered Simulation
    wait_simulation_delay(0.5, 1.5)
    if should_fail_delivery():
        db.log_event(communication_id, recipient, channel, message, "failed")
        send_webhook_callback_with_retry(communication_id, recipient, channel, message, "failed", backend_url)
        return

    db.log_event(communication_id, recipient, channel, message, "delivered")
    send_webhook_callback_with_retry(communication_id, recipient, channel, message, "delivered", backend_url)

    # 3. Opened Simulation
    wait_simulation_delay(0.5, 1.5)
    if not should_open():
        logger.info(f"Communication {communication_id} was not opened. Stopping flow.")
        return

    db.log_event(communication_id, recipient, channel, message, "opened")
    send_webhook_callback_with_retry(communication_id, recipient, channel, message, "opened", backend_url)

    # 4. Read Simulation
    wait_simulation_delay(0.5, 1.5)
    if not should_read():
        logger.info(f"Communication {communication_id} was opened but not read. Stopping flow.")
        return

    db.log_event(communication_id, recipient, channel, message, "read")
    send_webhook_callback_with_retry(communication_id, recipient, channel, message, "read", backend_url)

    # 5. Clicked Simulation
    wait_simulation_delay(0.5, 1.5)
    if not should_click():
        logger.info(f"Communication {communication_id} was read but not clicked. Stopping flow.")
        return

    db.log_event(communication_id, recipient, channel, message, "clicked")
    send_webhook_callback_with_retry(communication_id, recipient, channel, message, "clicked", backend_url)

    # 6. Converted Simulation
    wait_simulation_delay(0.5, 1.5)
    if not should_convert():
        logger.info(f"Communication {communication_id} was clicked but not converted. Stopping flow.")
        return

    db.log_event(communication_id, recipient, channel, message, "converted")
    send_webhook_callback_with_retry(communication_id, recipient, channel, message, "converted", backend_url)
