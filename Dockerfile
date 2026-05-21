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
RUN chown -R app:app /app

USER app

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
