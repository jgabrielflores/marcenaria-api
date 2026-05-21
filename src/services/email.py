import logging
import smtplib
from email.message import EmailMessage

from src.config import get_settings

logger = logging.getLogger("src.services.email")


def _verification_link(token: str) -> str:
    return f"{get_settings().api_base_url}/auth/verify?token={token}"


def send_verification_email(to_email: str, token: str) -> None:
    """Send the account-confirmation e-mail.

    With no SMTP host configured (local development) the link is logged
    instead of sent, so the flow is testable without a mail provider.
    """
    settings = get_settings()
    link = _verification_link(token)

    if not settings.smtp_host:
        logger.info("Verification link for %s: %s", to_email, link)
        return

    plain = (
        "Olá!\n\n"
        "Confirme seu e-mail para ativar sua conta na Ramos Planejados:\n\n"
        f"{link}\n\n"
        "O link expira em 24 horas. Se você não criou esta conta, ignore este e-mail.\n"
    )

    html = f"""\
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;color:#1a1a1a;max-width:520px;margin:0 auto;padding:32px 24px">
  <h2 style="font-size:1.25rem;margin-bottom:8px">Confirme seu e-mail</h2>
  <p style="color:#444;line-height:1.6">
    Olá! Clique no botão abaixo para ativar sua conta na
    <strong>Ramos Planejados</strong>.
  </p>
  <a href="{link}"
     style="display:inline-block;margin:24px 0;padding:12px 28px;
            background:#1a1a1a;color:#fff;text-decoration:none;
            border-radius:4px;font-size:0.9rem;letter-spacing:0.04em">
    Confirmar e-mail
  </a>
  <p style="font-size:0.8rem;color:#888;line-height:1.5">
    O link expira em 24 horas.<br>
    Se você não criou esta conta, ignore este e-mail.
  </p>
  <hr style="border:none;border-top:1px solid #eee;margin-top:32px">
  <p style="font-size:0.75rem;color:#aaa">Ramos Planejados — Marcenaria sob medida</p>
</body>
</html>"""

    msg = EmailMessage()
    msg["Subject"] = "Confirme seu e-mail — Ramos Planejados"
    msg["From"] = settings.smtp_from or settings.smtp_user
    msg["To"] = to_email
    msg.set_content(plain)
    msg.add_alternative(html, subtype="html")

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
        smtp.starttls()
        smtp.login(settings.smtp_user, settings.smtp_password.get_secret_value())
        smtp.send_message(msg)
    logger.info("Verification e-mail sent to %s", to_email)
