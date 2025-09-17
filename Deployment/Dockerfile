# Dockerfile for Hugging Face Spaces
FROM python:3.9-slim

# Create user for Hugging Face Spaces
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# System deps for pycaret and ML libraries
USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*
USER user

# Copy requirements and install dependencies
COPY --chown=user ./requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy application files
COPY --chown=user . /app

# Create necessary directories
RUN mkdir -p /app/forecast_images /app/enhanced_forecast_images /app/forecast_reports

# Expose port 7860 (required by Hugging Face Spaces)
EXPOSE 7860

# Run the main server
CMD ["python", "-u", "main.py"]


