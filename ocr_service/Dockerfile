FROM ccr-2vdh3abv-pub.cnc.bj.baidubce.com/paddlepaddle/paddle:3.2.0

ARG IMAGE_VERSION=latest
LABEL version=${IMAGE_VERSION}

WORKDIR /app

# Install Tesseract OCR on top of PaddlePaddle base
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-chi-sim \
    tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies (skip paddlepaddle to avoid downgrade)
RUN pip install --no-cache-dir --ignore-installed paddlepaddle \
    fastapi>=0.109.0 \
    uvicorn[standard]>=0.27.0 \
    python-multipart>=0.0.6 \
    pydantic>=2.0.0 \
    pydantic-settings>=2.0.0 \
    prometheus-client>=0.19.0 \
    structlog>=24.1.0 \
    pillow>=10.0.0 \
    pytesseract>=0.3.10

# Copy application code
COPY app/ ./app/

# Expose port
EXPOSE 8000

# Environment variables
ENV HOST=0.0.0.0
ENV PORT=8000
ENV LOG_LEVEL=info
ENV DEBUG=false
ENV MAX_FILE_SIZE=10485760

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
