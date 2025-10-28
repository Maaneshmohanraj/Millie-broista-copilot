# 🤝 Contributing to Broista Copilot

Thank you for your interest in contributing to Broista Copilot! This document provides guidelines and instructions for contributing.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

---

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, gender, gender identity, sexual orientation, disability, personal appearance, race, ethnicity, age, religion, or nationality.

### Expected Behavior

- Be respectful and considerate
- Use welcoming and inclusive language
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards others

### Unacceptable Behavior

- Harassment, trolling, or insulting comments
- Personal or political attacks
- Publishing others' private information
- Any conduct inappropriate in a professional setting

---

## 🚀 Getting Started

### 1. Fork the Repository

Click the "Fork" button at the top right of the repository page.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR-USERNAME/broista-copilot.git
cd broista-copilot
```

### 3. Add Upstream Remote

```bash
git remote add upstream https://github.com/original-owner/broista-copilot.git
```

### 4. Set Up Development Environment

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Add your AWS credentials to .env
```

### 5. Verify Setup

```bash
python src/production_entity_extractor.py
```

---

## 🔄 Development Workflow

### 1. Create a Feature Branch

```bash
# Update your fork
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

**Branch Naming Convention:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates

### 2. Make Your Changes

Write clean, well-documented code following our [Coding Standards](#coding-standards).

### 3. Test Your Changes

```bash
# Run the main test
python src/production_entity_extractor.py

# Run standalone tests
python tests/test_extractor_standalone.py
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add your feature description"
```

**Commit Message Format:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test updates
- `chore:` - Maintenance tasks

**Examples:**
```
feat: add support for Spanish language transcription
fix: resolve duplicate item detection bug
docs: update README with new configuration options
refactor: simplify modifier categorization logic
test: add unit tests for confidence scoring
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Open a Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill out the PR template
4. Wait for review

---

## 📝 Coding Standards

### Python Style Guide

We follow [PEP 8](https://pep8.org/) with some modifications.

**Key Points:**
- **Indentation:** 4 spaces (no tabs)
- **Line length:** 100 characters max
- **Imports:** Grouped and sorted (standard, third-party, local)
- **Docstrings:** Use for all functions and classes

**Example:**

```python
def extract_with_confidence(self, text: str, verbose: bool = False) -> Tuple[List[Dict], float]:
    """Extract entities with overall confidence score
    
    Args:
        text: Customer conversation text
        verbose: Print debug information
        
    Returns:
        Tuple of (items, confidence_score)
        
    Example:
        items, conf = extractor.extract_with_confidence("Large mocha please")
    """
    # Implementation
    pass
```

### Type Hints

Use type hints for function parameters and return values:

```python
from typing import List, Dict, Tuple, Optional

def process_items(items: List[Dict]) -> Tuple[List[Dict], float]:
    """Process items and return validated items with confidence"""
    pass
```

### Comments

- Use comments to explain WHY, not WHAT
- Keep comments up to date with code changes
- Use docstrings for public APIs

**Good:**
```python
# Use lower temperature for consistent extraction results
temperature = 0.0
```

**Bad:**
```python
# Set temperature to 0.0
temperature = 0.0
```

### Error Handling

Always handle errors gracefully:

```python
try:
    response = self.bedrock.invoke_model(...)
except Exception as e:
    print(f"❌ Extraction error: {e}")
    return []
```

---

## 🧪 Testing

### Writing Tests

Create test files in the `tests/` directory:

```python
# tests/test_new_feature.py

def test_modifier_categorization():
    """Test modifier categorization logic"""
    from src.production_entity_extractor import ProductionEntityExtractor
    
    extractor = ProductionEntityExtractor()
    
    # Test case
    modifiers = ["soft top", "oat milk", "extra sweet"]
    result = extractor._categorize_modifiers([{"mods": modifiers}])
    
    # Assertions
    assert result[0]["modifiers"]["toppings"] == ["Soft Top"]
    assert result[0]["modifiers"]["milk"] == "Oat Milk"
    assert result[0]["modifiers"]["sweetness"] == "Extra Sweet"
    
    print("✅ Test passed!")

if __name__ == "__main__":
    test_modifier_categorization()
```

### Running Tests

```bash
# Run specific test
python tests/test_new_feature.py

# Run all tests
python -m pytest tests/
```

### Test Coverage

Aim for:
- **Core logic:** 80%+ coverage
- **Edge cases:** Include unusual inputs
- **Error handling:** Test failure paths

---

## 📬 Submitting Changes

### Pull Request Checklist

Before submitting, ensure:

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New features have tests
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] PR description explains changes
- [ ] No merge conflicts

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested these changes

## Checklist
- [ ] Code follows project style
- [ ] Tests pass
- [ ] Documentation updated
```

### Review Process

1. **Automated checks** run on PR submission
2. **Maintainer review** within 2-3 days
3. **Feedback addressed** by contributor
4. **Approval and merge** by maintainer

---

## 🐛 Reporting Bugs

### Before Reporting

1. Check [existing issues](https://github.com/yourusername/broista-copilot/issues)
2. Verify you're using the latest version
3. Try to reproduce with minimal example

### Bug Report Template

```markdown
**Description:**
Clear description of the bug

**To Reproduce:**
1. Step 1
2. Step 2
3. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happened

**Environment:**
- OS: [e.g., macOS 14.0]
- Python version: [e.g., 3.10.5]
- Whisper version: [e.g., 20231117]

**Additional Context:**
Any other relevant information
```

---

## 💡 Feature Requests

### Suggesting Features

We welcome feature suggestions! Please:

1. Check if feature already requested
2. Explain the use case
3. Describe expected behavior
4. Consider implementation complexity

### Feature Request Template

```markdown
**Problem:**
What problem does this solve?

**Proposed Solution:**
How should this work?

**Alternatives:**
Other approaches considered?

**Additional Context:**
Any other relevant information
```

---

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

---

## 📚 Additional Resources

### Documentation
- [README.md](README.md) - Project overview
- [SETUP.md](SETUP.md) - Setup instructions


## 🙏 Thank You!

Every contribution, no matter how small, makes a difference. Thank you for helping make Broista Copilot better! ❤️

---

**Happy Coding! 🚀**
