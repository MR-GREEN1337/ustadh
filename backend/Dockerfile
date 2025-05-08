FROM python:3.13-slim

ENV PYTHONUNBUFFERED=true
WORKDIR /app

# Install system dependencies including libmagic
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    libcairo2-dev \
    libmagic1 \
    libmagic-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY /requirements.txt .
COPY .env .
RUN pip install --no-cache-dir -r requirements.txt

COPY /src/ ./src/

ENV PYTHONPATH=/app
ENV PORT=8000
ENV $(cat .env | xargs)

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
