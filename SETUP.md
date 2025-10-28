# 🔧 Broista Copilot - Setup Guide

Complete setup instructions for getting Broista Copilot running on your system.

---

## 📋 Prerequisites

### Required Software
- **Python 3.10 or higher** - [Download](https://www.python.org/downloads/)
- **Git** - [Download](https://git-scm.com/downloads)
- **AWS Account** with Bedrock access - [Sign up](https://aws.amazon.com/)
- **FFmpeg** - Required for audio processing

### Hardware Requirements
- **Minimum:** 8GB RAM, 4GB free disk space
- **Recommended:** 16GB RAM, 10GB free disk space

---

## 🚀 Step-by-Step Installation

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/broista-copilot.git

# Navigate to directory
cd broista-copilot
```

---

### Step 2: Install FFmpeg

FFmpeg is required for audio processing with Whisper.

#### macOS (using Homebrew)
```bash
brew install ffmpeg
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Windows
1. Download from [ffmpeg.org](https://ffmpeg.org/download.html)
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to PATH environment variable

**Verify installation:**
```bash
ffmpeg -version
```

---

### Step 3: Set Up Python Environment

#### Create Virtual Environment (Recommended)

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` in your terminal prompt.

---

### Step 4: Install Python Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install all dependencies
pip install -r requirements.txt
```

**This will install:**
- boto3 (AWS SDK)
- openai-whisper (speech recognition)
- sentence-transformers (embeddings)
- python-dotenv (environment management)
- And other required packages

**Installation time:** 5-10 minutes (Whisper model downloads automatically)

---

### Step 5: AWS Bedrock Setup

#### 5.1: Create AWS Account
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Follow the signup process
4. Add payment method (free tier available)

#### 5.2: Request Bedrock Access
1. Log into AWS Console
2. Search for "Bedrock" in services
3. Navigate to **Model Access** in left sidebar
4. Click **Request Model Access**
5. Find **Meta Llama 3.1 70B Instruct**
6. Check the box and click **Request Model Access**
7. Wait for approval (usually instant, can take up to 24 hours)

#### 5.3: Create IAM User
1. Go to **IAM** service in AWS Console
2. Click **Users** → **Add User**
3. User name: `broista-copilot-user`
4. Select **Programmatic access**
5. Click **Next: Permissions**

#### 5.4: Attach Permissions
1. Click **Attach existing policies directly**
2. Search for `AmazonBedrockFullAccess`
3. Check the box next to it
4. Click **Next: Tags** (skip tags)
5. Click **Next: Review**
6. Click **Create User**

#### 5.5: Save Credentials
**IMPORTANT:** Save these credentials securely!

1. You'll see **Access key ID** and **Secret access key**
2. Click **Show** to reveal secret access key
3. Download `.csv` file or copy credentials
4. **You cannot view the secret key again after leaving this page**

Example:
```
Access key ID: AKIAIOSFODNN7EXAMPLE
Secret access key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

---

### Step 6: Configure Environment Variables

#### 6.1: Copy Template
```bash
cp .env.example .env
```

#### 6.2: Edit .env File

Open `.env` in your text editor:

```bash
# macOS/Linux
nano .env

# Windows
notepad .env
```

#### 6.3: Add Your Credentials

Replace the placeholder values:

```bash
# AWS Configuration
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**Save and close the file.**

**Security Note:** Never commit `.env` to Git! (It's in `.gitignore`)

---

### Step 7: Verify Installation

#### 7.1: Test AWS Connection

```bash
# Test AWS credentials
python -c "import boto3; client = boto3.client('bedrock-runtime', region_name='us-west-2'); print('✅ AWS connection successful!')"
```

Expected output: `✅ AWS connection successful!`

#### 7.2: Test Whisper

```bash
# Test Whisper installation
python -c "import whisper; model = whisper.load_model('base'); print('✅ Whisper loaded successfully!')"
```

Expected output: `✅ Whisper loaded successfully!`

---

### Step 8: Run First Test

```bash
# Run the production extractor with built-in test
python src/production_entity_extractor.py
```

**Expected output:**
```
======================================================================
🎯 PRODUCTION ENTITY EXTRACTOR - COMPLETE TEST
======================================================================

⏳ Initializing Production Extractor (meta.llama3-1-70b-instruct-v1:0)...
✅ Ready!

⏱️  Extraction: 2.15s

✅ Parsed 5 items

🟢 white chocolate mocha (100%)
🟢 rainbow rebel (100%)
🟢 not so hot (100%)
🟢 golden eagle (100%)
🟢 lemon poppy seed muffin top (100%)

======================================================================
📊 FINAL RESULTS
======================================================================

Items Extracted: 5
Overall Confidence: 100%
Subtotal: $29.50
Total: $29.50

✅ SUCCESS!
📄 Saved to: clean_order.json
```

---

## 🎯 Directory Structure Setup

Create these directories if they don't exist:

```bash
mkdir -p data/audio
mkdir -p data/menu
mkdir -p data/cache
mkdir -p tests
```

---

## ⚙️ Configuration Options

### Model Selection

**Edit `src/production_entity_extractor.py`:**

```python
# Line 19 - Choose model
# For production (accurate):
model_id = "meta.llama3-1-70b-instruct-v1:0"

# For testing (faster):
model_id = "meta.llama3-1-8b-instruct-v1:0"
```

### Whisper Model Size

**Available models:**
- `tiny` - Fastest, least accurate (39M params)
- `base` - Good balance (74M params) **[DEFAULT]**
- `small` - More accurate (244M params)
- `medium` - Very accurate (769M params)
- `large` - Most accurate (1550M params)

**To change:**
```python
# In whisper_transcriber.py
model = whisper.load_model("base")  # Change "base" to desired size
```

---

## 🐛 Troubleshooting

### Error: "No module named 'whisper'"

**Solution:**
```bash
pip install openai-whisper
```

### Error: "Unable to locate credentials"

**Solutions:**
1. Check `.env` file exists in project root
2. Verify AWS credentials are correct
3. Ensure `.env` is not in `.gitignore` location
4. Try setting environment variables manually:
   ```bash
   export AWS_ACCESS_KEY_ID=your_key
   export AWS_SECRET_ACCESS_KEY=your_secret
   ```

### Error: "Could not access bedrock model"

**Solutions:**
1. Verify Bedrock model access request was approved
2. Check region is `us-west-2`
3. Ensure IAM user has `AmazonBedrockFullAccess` policy
4. Wait 5 minutes after requesting access

### Error: "FFmpeg not found"

**Solutions:**
1. Verify FFmpeg installation: `ffmpeg -version`
2. Ensure FFmpeg is in PATH
3. Restart terminal after installation
4. On Windows, add FFmpeg to system PATH manually

### Slow Processing

**Causes & Solutions:**
- **Whisper model too large:** Use `base` or `tiny` model
- **No GPU acceleration:** Expected on CPU-only systems
- **Network latency:** Check AWS region (use `us-west-2`)
- **First run:** Models download on first use (one-time delay)

---

## 🔍 Verification Checklist

Before using in production, verify:

- [ ] Python 3.10+ installed
- [ ] Virtual environment activated
- [ ] All dependencies installed
- [ ] FFmpeg working
- [ ] AWS credentials configured
- [ ] Bedrock model access approved
- [ ] Test runs successfully
- [ ] Output JSON generated

---

## 📞 Getting Help

### Common Issues

**Issue:** ImportError for boto3
- **Fix:** `pip install boto3`

**Issue:** Whisper downloads models slowly
- **Fix:** Wait for first-time download (one-time, ~140MB)

**Issue:** AWS rate limits
- **Fix:** Wait 1 minute between large batches

### Support Resources

- **GitHub Issues:** [Create an issue](https://github.com/yourusername/broista-copilot/issues)
- **AWS Bedrock Docs:** [aws.amazon.com/bedrock/docs](https://aws.amazon.com/bedrock/documentation/)
- **Whisper Docs:** [github.com/openai/whisper](https://github.com/openai/whisper)

---

## 🎓 Next Steps

Now that you're set up:

1. **Read README.md** - Learn about features and usage
2. **Try custom transcriptions** - Edit test text in `production_entity_extractor.py`
3. **Integrate with your app** - Import and use the extractor class
4. **Process audio files** - Add audio to `data/audio/` directory
5. **Customize menu** - Update `data/menu/menu_db.json`

---

## ✅ Setup Complete!

You're ready to start using Broista Copilot! 🎉

Run your first extraction:
```bash
python src/production_entity_extractor.py
```

---

**Questions? Open an issue on GitHub!**
