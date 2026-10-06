FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV and image operations
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install PyTorch and Python packages
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

ENV PORT=8000
ENV HOST=0.0.0.0
ENV MODEL_DEVICE=cpu

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
