import json
from unittest.mock import MagicMock, patch

import pytest

from src.services.email import send_verification_email


def _settings(api_key: str = "") -> MagicMock:
    settings = MagicMock()
    settings.api_base_url = "http://api.test"
    settings.brevo_api_key.get_secret_value.return_value = api_key
    settings.email_from = "sender@test.com"
    settings.email_from_name = "Ramos Planejados"
    return settings


@pytest.mark.unit
def test_send_verification_email_logs_link_when_provider_not_configured():
    with patch("src.services.email.get_settings", return_value=_settings("")):
        with patch("src.services.email.urllib.request.urlopen") as mock_urlopen:
            with patch("src.services.email.logger") as mock_logger:
                send_verification_email("customer@test.com", "the-token")

    mock_urlopen.assert_not_called()
    logged = " ".join(
        str(arg) for call in mock_logger.info.call_args_list for arg in call.args
    )
    assert "the-token" in logged


@pytest.mark.unit
def test_send_verification_email_sends_via_brevo_when_configured():
    with patch("src.services.email.get_settings", return_value=_settings("xkeysib-123")):
        with patch("src.services.email.urllib.request.urlopen") as mock_urlopen:
            mock_urlopen.return_value.__enter__.return_value.read.return_value = b"{}"
            send_verification_email("customer@test.com", "the-token")

    mock_urlopen.assert_called_once()
    request = mock_urlopen.call_args.args[0]
    assert request.full_url == "https://api.brevo.com/v3/smtp/email"
    assert request.get_header("Api-key") == "xkeysib-123"
    body = json.loads(request.data.decode("utf-8"))
    assert body["to"][0]["email"] == "customer@test.com"
    assert body["sender"]["email"] == "sender@test.com"
    assert "the-token" in body["htmlContent"]
