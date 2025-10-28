# 🚀 Broista Copilot - Deployment Guide

Production deployment instructions for various environments.

---

## 📋 Table of Contents

- [Deployment Options](#deployment-options)
- [AWS Deployment](#aws-deployment)
- [Docker Deployment](#docker-deployment)
- [Local Server](#local-server)
- [Integration Guide](#integration-guide)
- [Monitoring](#monitoring)
- [Scaling](#scaling)

---

## 🎯 Deployment Options

### Option 1: AWS Lambda (Serverless)
**Best for:** Variable workload, cost optimization
- Pay per request
- Auto-scaling
- No server management

### Option 2: AWS EC2 (Server)
**Best for:** Consistent workload, full control
- Dedicated resources
- Predictable costs
- Custom configuration

### Option 3: Docker Container
**Best for:** Portability, easy deployment
- Consistent environment
- Easy updates
- Platform independent

### Option 4: Local Server
**Best for:** Development, testing
- No cloud costs
- Full control
- Easy debugging

---

## ☁️ AWS Deployment

### AWS Lambda Deployment

#### Step 1: Prepare Code

```bash
# Create deployment package
mkdir lambda-package
cp -r src/* lambda-package/
cp requirements.txt lambda-package/

cd lambda-package
pip install -r requirements.txt -t .
```

#### Step 2: Create Lambda Function

```python
# lambda_handler.py
import json
from production_entity_extractor import ProductionEntityExtractor

extractor = ProductionEntityExtractor()

def lambda_handler(event, context):
    """AWS Lambda handler"""
    
    # Get transcription from event
    transcription = event.get('transcription', '')
    
    if not transcription:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'No transcription provided'})
        }
    
    # Extract items
    items, confidence = extractor.extract_with_confidence(
        transcription, 
        verbose=False
    )
    
    # Return response
    return {
        'statusCode': 200,
        'body': json.dumps({
            'items': items,
            'confidence': confidence
        })
    }
```

#### Step 3: Deploy to Lambda

```bash
# Zip deployment package
zip -r lambda-package.zip .

# Upload to AWS Lambda
aws lambda create-function \
    --function-name broista-copilot \
    --runtime python3.10 \
    --role arn:aws:iam::ACCOUNT_ID:role/lambda-bedrock-role \
    --handler lambda_handler.lambda_handler \
    --zip-file fileb://lambda-package.zip \
    --timeout 300 \
    --memory-size 1024
```

#### Step 4: Configure Environment

```bash
aws lambda update-function-configuration \
    --function-name broista-copilot \
    --environment Variables={AWS_REGION=us-west-2}
```

### AWS EC2 Deployment

#### Step 1: Launch EC2 Instance

1. Choose AMI: Ubuntu 22.04 LTS
2. Instance type: t3.medium (4GB RAM recommended)
3. Configure security group (allow ports 22, 80, 443)
4. Launch instance

#### Step 2: Connect and Setup

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install python3.10 python3-pip ffmpeg -y

# Clone repository
git clone https://github.com/yourusername/broista-copilot.git
cd broista-copilot

# Install dependencies
pip3 install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env  # Add credentials
```

#### Step 3: Set Up as Service

```bash
# Create systemd service
sudo nano /etc/systemd/system/broista-copilot.service
```

```ini
[Unit]
Description=Broista Copilot Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/broista-copilot
ExecStart=/usr/bin/python3 /home/ubuntu/broista-copilot/src/api_server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable broista-copilot
sudo systemctl start broista-copilot
sudo systemctl status broista-copilot
```

---

## 🐳 Docker Deployment

### Dockerfile

```dockerfile
# Dockerfile
FROM python:3.10-slim

# Install FFmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY data/ ./data/

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Run application
CMD ["python", "src/api_server.py"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  broista-copilot:
    build: .
    ports:
      - "8000:8000"
    environment:
      - AWS_REGION=${AWS_REGION}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    env_file:
      - .env
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

### Build and Run

```bash
# Build image
docker build -t broista-copilot .

# Run container
docker run -d \
  --name broista-copilot \
  -p 8000:8000 \
  --env-file .env \
  broista-copilot

# Or use docker-compose
docker-compose up -d
```

---

## 💻 Local Server

### Flask API Server

```python
# src/api_server.py
from flask import Flask, request, jsonify
from production_entity_extractor import ProductionEntityExtractor

app = Flask(__name__)
extractor = ProductionEntityExtractor()

@app.route('/extract', methods=['POST'])
def extract_order():
    """Extract order from transcription"""
    
    data = request.json
    transcription = data.get('transcription', '')
    
    if not transcription:
        return jsonify({'error': 'No transcription provided'}), 400
    
    try:
        items, confidence = extractor.extract_with_confidence(
            transcription,
            verbose=False
        )
        
        return jsonify({
            'success': True,
            'items': items,
            'confidence': confidence
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)
```

### Run Server

```bash
# Install Flask
pip install flask

# Run server
python src/api_server.py

# Server runs on http://localhost:8000
```

### Test API

```bash
# Health check
curl http://localhost:8000/health

# Extract order
curl -X POST http://localhost:8000/extract \
  -H "Content-Type: application/json" \
  -d '{
    "transcription": "Large iced mocha with oat milk please"
  }'
```

---

## 🔌 Integration Guide

### REST API Integration

```javascript
// JavaScript/Node.js example
async function extractOrder(transcription) {
  const response = await fetch('http://your-server:8000/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transcription: transcription
    })
  });
  
  const data = await response.json();
  return data;
}

// Usage
const result = await extractOrder("Large mocha please");
console.log(result.items);
```

### Python SDK Integration

```python
# Python SDK example
import requests

def extract_order(transcription):
    """Extract order from transcription"""
    
    response = requests.post(
        'http://your-server:8000/extract',
        json={'transcription': transcription}
    )
    
    return response.json()

# Usage
result = extract_order("Large mocha please")
print(result['items'])
```

### POS System Integration

```python
# Example: Square POS integration
from square.client import Client

def send_to_pos(items, total):
    """Send order to Square POS"""
    
    client = Client(
        access_token='YOUR_SQUARE_TOKEN',
        environment='production'
    )
    
    # Create order
    order = {
        'line_items': [
            {
                'name': item['name'],
                'quantity': str(item['quantity']),
                'base_price_money': {
                    'amount': int(item['price'] * 100),
                    'currency': 'USD'
                }
            }
            for item in items
        ]
    }
    
    result = client.orders.create_order(
        body={'order': order}
    )
    
    return result
```

---

## 📊 Monitoring

### CloudWatch Logs (AWS)

```bash
# View Lambda logs
aws logs tail /aws/lambda/broista-copilot --follow

# View EC2 logs
sudo journalctl -u broista-copilot -f
```

### Application Metrics

```python
# Add to production_entity_extractor.py
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_with_confidence(self, text: str, verbose=False):
    """Extract with metrics logging"""
    
    start_time = time.time()
    
    try:
        items, confidence = self._extract(text)
        
        # Log metrics
        duration = time.time() - start_time
        logger.info(f"Extraction completed: {len(items)} items, "
                   f"{confidence:.0%} confidence, {duration:.2f}s")
        
        return items, confidence
        
    except Exception as e:
        logger.error(f"Extraction failed: {e}")
        raise
```

---

## 📈 Scaling

### Horizontal Scaling

**Load Balancer + Multiple Instances:**

```bash
# AWS Application Load Balancer
# Distribute traffic across multiple EC2 instances

# Auto Scaling Group
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name broista-asg \
    --launch-configuration-name broista-lc \
    --min-size 2 \
    --max-size 10 \
    --desired-capacity 2 \
    --target-group-arns arn:aws:elasticloadbalancing:...
```

### Vertical Scaling

**Increase instance resources:**
- CPU: More powerful instance type
- Memory: Larger instance (8GB+ for heavy workload)
- Network: Enhanced networking enabled

### Caching Strategy

```python
# Redis cache for embeddings
import redis

cache = redis.Redis(host='localhost', port=6379)

def get_cached_embedding(text):
    """Get embedding from cache or compute"""
    
    cached = cache.get(f"emb:{text}")
    if cached:
        return pickle.loads(cached)
    
    # Compute and cache
    embedding = model.encode(text)
    cache.set(f"emb:{text}", pickle.dumps(embedding))
    
    return embedding
```

---

## 🔒 Security Checklist

- [ ] Use IAM roles instead of access keys (AWS)
- [ ] Enable HTTPS/TLS for API endpoints
- [ ] Implement rate limiting
- [ ] Add API authentication (API keys/tokens)
- [ ] Encrypt sensitive data at rest
- [ ] Regular security updates
- [ ] Monitor for suspicious activity
- [ ] Backup regularly

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All tests pass
- [ ] Environment variables configured
- [ ] AWS credentials set up
- [ ] Dependencies installed
- [ ] Documentation updated

### During Deployment
- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Monitor logs
- [ ] Verify endpoints
- [ ] Check performance

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check latency
- [ ] Verify scaling
- [ ] Update documentation
- [ ] Notify stakeholders

---

## 🆘 Troubleshooting

### High Latency
- Check AWS region (use us-west-2)
- Increase instance size
- Enable caching
- Optimize model calls

### High Error Rate
- Check AWS credentials
- Verify Bedrock access
- Review logs
- Check network connectivity

### Out of Memory
- Increase instance memory
- Reduce batch sizes
- Clear caches regularly
- Use smaller Whisper model

---

## 📞 Support

For deployment assistance:
- **GitHub Issues:** [Report deployment issues](https://github.com/yourusername/broista-copilot/issues)
- **Email:** your.email@example.com

---

**Deployment Complete! 🚀**
