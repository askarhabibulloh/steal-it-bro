# Vulnerable-by-Design DNS Lookup Tool - OS Command Injection Lab
# Base image: Ubuntu 22.04
FROM ubuntu:22.04

# Set environment variables to avoid interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Update package list and install required tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    dnsutils \
    whois \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for running the application
RUN useradd -m -s /bin/bash webuser

# Create directory for the application
RUN mkdir -p /app
WORKDIR /app

# Copy application files
COPY app.py /app/
COPY templates/ /app/templates/

# Create flag file with secret content
RUN mkdir -p /var/www && \
    echo "CTF{DNS_iNjeCti0n_SuCceSs_2026}" > /var/www/flag_rahasia.txt && \
    chmod 644 /var/www/flag_rahasia.txt

# Install Python dependencies
COPY requirements.txt /app/
RUN pip3 install --no-cache-dir -r requirements.txt

# Set proper permissions
RUN chown -R webuser:webuser /app && \
    chmod -R 755 /app

# Switch to non-root user
USER webuser

# Expose Flask port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Run the application
CMD ["python3", "app.py"]