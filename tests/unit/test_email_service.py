from unittest.mock import MagicMock, patch

import pytest

from src.services.email import send_verification_email


def _settings(smtp_host: str = "") -> MagicMock:
    settings = MagicMock()
    settings.api_base_url = "http://api.test"
    settings.smtp_host = smtp_host
    settings.smtp_port = 587
    settings.smtp_user = "sender@test.com"
    settings.smtp_from = ""
    settings.smtp_password.get_secret_value.return_value = "app-password"
    return settings


@pytest.mark.unit
def test_send_verification_email_logs_link_when_smtp_not_configured():
    with patch("src.services.email.get_settings", return_value=_settings("")):
        with patch("src.services.email.smtplib.SMTP") as mock_smtp:
            with patch("src.services.email.logger") as mock_logger:
                send_verification_email("customer@test.com", "the-token")

    mock_smtp.assert_not_called()
    logged = " ".join(
        str(arg) for call in mock_logger.info.call_args_list for arg in call.args
    )
    assert "the-token" in logged


@pytest.mark.unit
def test_send_verification_email_sends_via_smtp_when_configured():
    with patch("src.services.email.get_settings", return_value=_settings("smtp.test.com")):
        with patch("src.services.email.smtplib.SMTP") as mock_smtp:
            send_verification_email("customer@test.com", "the-token")

    mock_smtp.assert_called_once_with("smtp.test.com", 587)
    smtp = mock_smtp.return_value.__enter__.return_value
    smtp.starttls.assert_called_once()
    smtp.login.assert_called_once_with("sender@test.com", "app-password")
    smtp.send_message.assert_called_once()
