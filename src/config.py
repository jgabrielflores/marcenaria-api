from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    secret_key: SecretStr = Field(min_length=32)
    algorithm: Literal["HS256"] = "HS256"
    access_token_expire_minutes: int = 1440
    admin_email: str
    admin_password: SecretStr
    env: Literal["development", "production"] = "production"
    frontend_origin: str = "http://localhost:3000"
    api_base_url: str = "http://localhost:8000"

    # E-mail (Brevo transactional API over HTTPS — Railway blocks outbound SMTP).
    # When BREVO_API_KEY is unset, verification e-mails are logged instead of sent.
    brevo_api_key: SecretStr = SecretStr("")
    email_from: str = ""
    email_from_name: str = "Ramos Planejados"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
