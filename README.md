# 🎯 Broista Copilot

**AI-Powered Voice Ordering System for Coffee Shops**

![Dutch Bros Co-Pilot](https://github.com/user-attachments/assets/9c5a111d-611d-48bd-8ab8-13002361931f)


Convert natural customer conversations into structured, actionable orders in seconds. Built with OpenAI Whisper and Meta Llama 3.1 70B.

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![AWS Bedrock](https://img.shields.io/badge/AWS-Bedrock-orange.svg)](https://aws.amazon.com/bedrock/)

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/broista-copilot.git
cd broista-copilot

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your AWS credentials

# Run the extractor
python src/production_entity_extractor.py
```

---

## 📊 Results

**Test Case: 90-second real-world conversation**

✅ **5/5 items extracted** (100% accuracy)  
✅ **100% confidence** scores  
✅ **10 seconds** total processing time  
✅ **Perfect modifier categorization**

**Items Successfully Extracted:**
1. Large Hot White Chocolate Mocha + Extra Sweet + Soft Top
2. Medium Blended Rainbow Rebel + Boba + Double Blended
3. Kids Not So Hot + Whipped Cream
4. Small Iced Golden Eagle + Oat Milk
5. Lemon Poppy Seed Muffin Top

---

## 🏗️ Architecture

```
Audio Input → Transcription → Entity Extraction → Categorization → Output JSON
   (WAV)      (Whisper AI)    (Llama 70B)       (9 Categories)    (UI Ready)
```

### Processing Pipeline

| Stage | Technology | Time | Purpose |
|-------|-----------|------|---------|
| **Transcription** | OpenAI Whisper | 5-8s | Speech to text |
| **Extraction** | Llama 3.1 70B | 2-3s | Find items & modifiers |
| **Categorization** | Python | <1s | Organize into 9 categories |
| **Matching** | Sentence Transformers | 1-2s | Match to menu (530 products) |
| **Output** | JSON | <1s | Build structured order |

**Total:** 8-12 seconds end-to-end

---

## 💻 Tech Stack

- **Language:** Python 3.10+
- **Speech Recognition:** OpenAI Whisper (base model)
- **LLM:** Meta Llama 3.1 70B via AWS Bedrock
- **Embeddings:** Sentence Transformers (all-MiniLM-L6-v2)
- **Cloud:** AWS Bedrock (us-west-2)

---

## 📁 Project Structure

```
broista-copilot/
├── src/
│   ├── production_entity_extractor.py  # Main extraction logic (ALL-IN-ONE)
│   ├── whisper_transcriber.py          # Audio → Text
│   ├── fuzzy_matcher.py                # Product matching
│   ├── menu_loader.py                  # Menu database loader
│   ├── order_builder.py                # Price calculation
│   ├── ui_order_formatter.py           # JSON formatting
│   └── api_pipeline.py                 # Full pipeline orchestrator
├── data/
│   ├── audio/                          # Test audio files
│   ├── menu/                           # Menu database (530 products)
│   └── cache/                          # Cached embeddings
├── tests/
│   └── test_extractor_standalone.py    # Standalone test
├── .env.example                        # Environment template
├── .gitignore                          # Git ignore rules
├── requirements.txt                    # Python dependencies
└── README.md                           # This file
```

---

## 🔧 Installation

### Prerequisites

- Python 3.10 or higher
- AWS Account with Bedrock access
- FFmpeg (for audio processing)

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/broista-copilot.git
cd broista-copilot
```

### Step 2: Install Python Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Install FFmpeg (for Whisper)

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html)

### Step 4: Set Up AWS Credentials

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your credentials
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
```

**AWS Bedrock Setup:**
1. Log into AWS Console
2. Navigate to AWS Bedrock
3. Request access to Llama 3.1 70B model
4. Create IAM user with Bedrock permissions
5. Generate access keys

---

## 🎯 Usage

### Quick Test (All-in-One)

```bash
# Run the production extractor with built-in test
python src/production_entity_extractor.py
```

**Output:**
```
======================================================================
🎯 PRODUCTION ENTITY EXTRACTOR - COMPLETE TEST
======================================================================

Items Extracted: 5
Overall Confidence: 100%
Subtotal: $29.50
Total: $29.50

✅ SUCCESS!
📄 Saved to: clean_order.json
```

### Standalone Extraction Test

```bash
# Test only the extractor (no audio processing)
python tests/test_extractor_standalone.py
```

### Use in Your Code

```python
from src.production_entity_extractor import ProductionEntityExtractor

# Initialize extractor
extractor = ProductionEntityExtractor()

# Extract from transcription
transcription = "Large iced mocha with oat milk, please."
items, confidence = extractor.extract_with_confidence(transcription, verbose=True)

# Use items in your application
print(f"Found {len(items)} items with {confidence:.0%} confidence")
```

---

## 📊 Output Format

### JSON Structure

```json
{
  "transcription": "Full conversation text...",
  "confidence": 1.0,
  "items": [
    {
      "id": "item-1",
      "name": "White Chocolate Mocha",
      "product_id": 12345,
      "size": "large",
      "temperature": "hot",
      "quantity": 1,
      "price": 7.50,
      "confidence": 1.0,
      "status": "confirmed",
      "modifiers": {
        "toppings": ["Soft Top"],
        "drizzles": [],
        "sprinks": [],
        "milk": null,
        "ice_level": null,
        "sweetness": "Extra Sweet",
        "liquid_sweetener": [],
        "sweetener_packets": [],
        "espresso": []
      },
      "special_instructions": "",
      "modifier_prices": [
        {"name": "Soft Top", "price": 0.75}
      ]
    }
  ],
  "subtotal": 29.50,
  "total": 29.50,
  "flags": []
}
```

### 9 Modifier Categories

1. **Toppings** - Soft Top, Whipped Cream
2. **Drizzles** - Caramel, Chocolate, White Chocolate
3. **Sprinks** - Boba, Chocolate Sprinks, Rainbow Sprinks
4. **Milk** - Oat, Almond, Coconut, 2%, Nonfat, Protein
5. **Ice Level** - No Ice, Light Ice, Extra Ice
6. **Sweetness** - Half Sweet, Extra Sweet
7. **Liquid Sweetener** - Vanilla, Caramel, Hazelnut (syrups)
8. **Sweetener Packets** - Sugar, Splenda, Stevia
9. **Espresso** - Extra Shot, Decaf

---

## 💡 Key Features

### 🧠 Conversation Intelligence
- **Pronoun Resolution:** Understands "that", "it", "those"
- **Modification Tracking:** "Add soft top" applies to last item
- **Quantity Changes:** "Make that three" updates quantity
- **Context Preservation:** Remembers across multiple turns

### 🎯 High Accuracy
- **100% extraction** on real-world test
- **Confidence scoring** for each item
- **Status flags** (confirmed/review/uncertain)
- **False positive filtering**

### 🏗️ Production Ready
- **Hybrid approach:** LLM + Python reliability
- **Error handling** and validation
- **Duplicate detection**
- **Extensible architecture**

### 💰 Cost Effective
- **$0.01 per order** (AWS Bedrock usage)
- **Self-hosted Whisper** (no transcription API costs)
- **Cached embeddings** (no repeated computation)

---

## 🔬 Technical Details

### Extraction Strategy

**Two-Step Process:**
1. **LLM Extraction** - Llama 70B extracts in simple format
2. **Python Transformation** - Categorizes into structured format

**Why This Works:**
- Simple format is easier for LLM to produce reliably
- Python handles complex categorization logic
- Best of both worlds: AI intelligence + programmatic reliability

### Prompt Engineering

**Key Techniques:**
- Chain-of-thought reasoning
- Few-shot examples with reasoning
- Critical rules for edge cases
- Structured output format specification

### Confidence Calculation

```python
# Factors affecting confidence:
- Product mentioned in text: 100%
- Partial match: 30-100% (word overlap ratio)
- Has size specified: +5%
- Has temperature specified: +5%
```

### Status Flags

- 🟢 **Confirmed** (≥90% confidence) - Auto-approve
- 🟡 **Review** (75-89% confidence) - Barista verification
- 🔴 **Uncertain** (<75% confidence) - Customer clarification needed

---

## 🧪 Testing

### Run All Tests

```bash
# Test production extractor
python src/production_entity_extractor.py

# Test standalone extractor
python tests/test_extractor_standalone.py
```

### Add Your Own Test

```python
from src.production_entity_extractor import ProductionEntityExtractor

extractor = ProductionEntityExtractor()

test_text = "Your test conversation here"
items, confidence = extractor.extract_with_confidence(test_text, verbose=True)

assert len(items) > 0, "Should extract at least one item"
print(f"✅ Test passed! Found {len(items)} items")
```

---

## 🚀 Deployment Scenarios

### 1. Drive-Thru
- Real-time audio capture from microphone
- 10-second processing → barista confirmation screen
- One-click send to POS system

### 2. Phone Orders
- Record call audio → process → send confirmation
- Auto-populate POS system
- Email/SMS order summary to customer

### 3. Mobile App
- In-app voice ordering button
- Show structured order for review
- Submit to location

### 4. Self-Service Kiosk
- Voice-enabled touch screen
- Visual confirmation before payment
- Multi-language support potential

---

## 📈 Performance

### Speed Benchmarks
- **Transcription:** 5-8 seconds (Whisper base model)
- **Extraction:** 2-3 seconds (Llama 70B)
- **Categorization:** <1 second (Python)
- **Total:** 8-12 seconds end-to-end

### Accuracy Metrics
- **Items:** 5/5 (100%)
- **Drinks:** 4/4 (100%)
- **Food:** 1/1 (100%)
- **Modifiers:** 6/6 (100%)
- **False Positives:** 0

---

## 💰 Cost Analysis

### Per-Order Cost
- **AWS Bedrock (Llama 70B):** ~$0.01
- **Whisper (self-hosted):** $0.00
- **Total:** ~$0.01 per order

### ROI Calculation
- **Time saved:** 2-3 minutes per order
- **At $15/hour wage:** $0.50-$0.75 saved
- **ROI:** 50x-75x return on investment

### Scale Economics
| Monthly Orders | Cost | Per Order |
|----------------|------|-----------|
| 1,000 | $15 | $0.015 |
| 10,000 | $120 | $0.012 |
| 100,000 | $1,100 | $0.011 |

---

## 🔮 Roadmap

### Phase 2: Enhanced Intelligence
- [ ] Multi-language support (Spanish, Mandarin)
- [ ] Real-time streaming (WebSocket)
- [ ] Accent adaptation
- [ ] Background noise filtering
- [ ] Voice authentication for loyalty

### Phase 3: Business Features
- [ ] Upsell suggestions
- [ ] Order history personalization
- [ ] Dietary restriction detection
- [ ] Allergy warnings
- [ ] Inventory integration

### Phase 4: Scale
- [ ] Multi-location deployment
- [ ] Cloud-native infrastructure
- [ ] Analytics dashboard
- [ ] A/B testing framework
- [ ] Continuous model fine-tuning

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
# Fork and clone the repo
git clone https://github.com/yourusername/broista-copilot.git
cd broista-copilot

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and test
python src/production_entity_extractor.py

# Commit and push
git add .
git commit -m "Add your feature"
git push origin feature/your-feature-name

# Open a Pull Request
```

---

## 📧 Contact

**Project Maintainer:** Maanesh
- GitHub: [@Maaneshmohanraj](https://github.com/maaneshmohanraj)
- Email: maaneshmohanraj@gmail.com

---

## 🌟 Star History

If you find this project helpful, please consider giving it a star! ⭐

---

**Built with ❤️ for the coffee shop industry**
