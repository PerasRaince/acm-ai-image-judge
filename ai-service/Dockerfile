FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV and image operations
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Hugging Face Spaces security policy: run container as non-root user (UID 1000)
RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    HF_HOME=/home/user/.cache/huggingface \
    TORCH_HOME=/home/user/.cache/torch

RUN mkdir -p /home/user/app /home/user/.cache/huggingface /home/user/.cache/torch && \
    chown -R user:user /home/user

WORKDIR /home/user/app

USER user

COPY --chown=user:user requirements.txt .

# Install dependencies into user space
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --user -r requirements.txt

COPY --chown=user:user app ./app

# Hugging Face Spaces default port is 7860
ENV PORT=7860
ENV HOST=0.0.0.0
ENV MODEL_DEVICE=cpu
# Hugging Face Spaces provides 16GB RAM for free; full 6-metric ensemble enabled
ENV LOW_MEMORY_MODE=false

EXPOSE 7860

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
