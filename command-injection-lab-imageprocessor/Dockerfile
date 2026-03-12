# Vulnerable-by-Design Image Processing Lab - Command Injection with ImageMagick
# Base image: Ubuntu 22.04
FROM ubuntu:22.04

# Set environment variables to avoid interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Update package list and install required tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    imagemagick \
    curl \
    netcat \
    wget \
    iputils-ping \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for running the application
RUN useradd -m -s /bin/bash webapp

# Create directory for the application
RUN mkdir -p /app
WORKDIR /app

# Copy application files
COPY app.py /app/
COPY templates/ /app/templates/

# Create flag file with secret content
RUN mkdir -p /var && \
    echo "FLAG{IMG_MAGICK_INJECTION_SUCCESS}" > /var/secret_data_flag.txt && \
    chmod 644 /var/secret_data_flag.txt && \
    chown webapp:webapp /var/secret_data_flag.txt

# Configure ImageMagick policy to allow basic image processing
RUN mv /etc/ImageMagick-6/policy.xml /etc/ImageMagick-6/policy.xml.bak && \
    cat > /etc/ImageMagick-6/policy.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE policymap [
<!ELEMENT policymap (policy)+>
<!ELEMENT policy (#PCDATA)>
<!ATTLIST policy domain (delegate|coder|filter|path|resource) #IMPLIED>
<!ATTLIST policy name CDATA #IMPLIED>
<!ATTLIST policy pattern CDATA #IMPLIED>
<!ATTLIST policy rights CDATA #IMPLIED>
<!ATTLIST policy stealth CDATA #IMPLIED>
]>
<policymap>
  <!-- Allow basic image formats -->
  <policy domain="coder" rights="read|write" pattern="PDF" />
  <policy domain="coder" rights="read|write" pattern="PNG" />
  <policy domain="coder" rights="read|write" pattern="JPEG" />
  <policy domain="coder" rights="read|write" pattern="GIF" />
  <policy domain="coder" rights="read|write" pattern="BMP" />
  <policy domain="coder" rights="read|write" pattern="WEBP" />
  <policy domain="coder" rights="read|write" pattern="TIFF" />
  
  <!-- Allow basic operations -->
  <policy domain="filter" rights="read|write" pattern="*" />
  <policy domain="delegate" rights="*" pattern="*" />
  
  <!-- Allow temporary files -->
  <policy domain="resource" name="memory" value="256MiB"/>
  <policy domain="resource" name="map" value="512MiB"/>
  <policy domain="resource" name="width" value="16KP"/>
  <policy domain="resource" name="height" value="16KP"/>
  <policy domain="resource" name="area" value="128MB"/>
  <policy domain="resource" name="disk" value="1GiB"/>
</policymap>
EOF

# Install Python dependencies
COPY requirements.txt /app/
RUN pip3 install --no-cache-dir -r requirements.txt

# Create uploads and static directories
RUN mkdir -p /app/uploads /app/static

# Set proper permissions
RUN chown -R webapp:webapp /app && \
    chmod -R 755 /app

# Switch to non-root user
USER webapp

# Expose Flask port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Run the application
CMD ["python3", "app.py"]