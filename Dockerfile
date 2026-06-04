FROM python:3.12-slim

# PYTHONDONTWRITEBYTECODE: skip .pyc files (saves space inside the image)
# PYTHONUNBUFFERED: flush stdout/stderr immediately so logs appear in real time
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Create an unprivileged user — running as root inside a container is a security risk
RUN groupadd --system app && useradd --system --gid app app

WORKDIR /app

# Copy the dependency manifest first.
# Docker caches this layer — if pyproject.toml hasn't changed, pip install is skipped.
COPY pyproject.toml ./
RUN mkdir src && touch src/__init__.py
RUN pip install --no-cache-dir "."

# Copy source code and migrations after deps — small layers, rebuild quickly on changes.
COPY src/ ./src/
COPY migrations/ ./migrations/
COPY alembic.ini ./
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh
RUN chown -R app:app /app

USER app

# EXPOSE is documentation only. The real listening port is decided at runtime
# via $PORT (see entrypoint.sh) — the platform may assign a different port.
EXPOSE 8000

# Container-level health check: hits /health on the runtime port.
# Uses Python (always present) instead of curl, which slim images omit.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import os,urllib.request; urllib.request.urlopen('http://localhost:' + os.environ.get('PORT','8000') + '/health')" || exit 1

# Delegate startup to the entrypoint: migrate -> seed -> serve on $PORT.
CMD ["./entrypoint.sh"]
