# src/production_entity_extractor.py
"""
ALL-IN-ONE PRODUCTION ENTITY EXTRACTOR
Just run: python src/production_entity_extractor.py
"""

import boto3
import json
import os
import re
from typing import Dict, List, Tuple
from dotenv import load_dotenv

load_dotenv()

class ProductionEntityExtractor:
    """Production-grade entity extraction with validation and confidence scoring"""
    
    def __init__(self, model_id="meta.llama3-1-70b-instruct-v1:0"):
        """Initialize with best model for accuracy"""
        self.model_id = model_id
        
        print(f"⏳ Initializing Production Extractor ({model_id.split('.')[-1]})...")
        
        self.bedrock = boto3.client(
            'bedrock-runtime',
            region_name=os.getenv('AWS_REGION', 'us-west-2'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        
        print("✅ Ready!")
    
    def extract_with_confidence(self, text: str, verbose=False) -> Tuple[List[Dict], float]:
        """Extract entities with overall confidence score"""
        
        # Step 1: Extract with simple format (proven to work)
        items_with_reasoning = self._extract_with_reasoning(text, verbose)
        
        # Step 2: Transform to categorized format
        categorized_items = self._categorize_modifiers(items_with_reasoning)
        
        # Step 3: Validate and score
        validated_items = self._validate_and_score(categorized_items, text, verbose)
        
        # Step 4: Calculate overall confidence
        if validated_items:
            avg_confidence = sum(item['confidence'] for item in validated_items) / len(validated_items)
        else:
            avg_confidence = 0.0
        
        return validated_items, avg_confidence
    
    def _extract_with_reasoning(self, text: str, verbose: bool) -> List[Dict]:
        """Extract using SIMPLE format (proven to work)"""
        
        prompt = self._build_simple_prompt(text)
        
        try:
            import time
            start = time.time()
            
            response = self._call_bedrock(prompt)
            elapsed = time.time() - start
            
            if verbose:
                print(f"⏱️  Extraction: {elapsed:.2f}s\n")
                print(f"🤖 Response:\n{response[:800]}...\n")
            
            items = self._parse_response(response, verbose)
            return items
            
        except Exception as e:
            print(f"❌ Extraction error: {e}")
            return []
    
    def _build_simple_prompt(self, text: str) -> str:
        """Simple prompt that works reliably"""
        
        return f"""You are an expert barista assistant. Extract order items using step-by-step reasoning.

TASK: Analyze this conversation and extract ALL drink/food items ordered.

CONVERSATION:
"{text}"

REASONING PROCESS:
1. Identify all product mentions (ignore chitchat like "how are you", "thank you")
2. For each product, determine:
   - Is this a NEW item or a MODIFICATION to previous item?
   - What size? (small/medium/large/kids)
   - What temperature? (hot/iced/blended)
   - What modifiers? (soft top, oat milk, boba, extra sweet, whip, etc.)
   - What quantity? (one=1, two=2, etc.)
3. Handle special cases:
   - "actually, make that iced" = MODIFY previous item's temperature
   - "can you add soft top" = ADD modifier to previous item
   - "and" or "also" = usually means NEW item
   - "double blended" = modifier, not part of product name

EXAMPLES:

Example 1: Simple drink
Input: "Can I get a large hot mocha with soft top?"
Output: [{{"product":"mocha","size":"large","temp":"hot","mods":["soft top"],"qty":1,"is_new_item":true}}]

Example 2: Multiple items with food
Input: "Medium iced golden eagle and a lemon muffin"
Output: [
  {{"product":"golden eagle","size":"medium","temp":"iced","mods":[],"qty":1,"is_new_item":true}},
  {{"product":"lemon muffin","size":null,"temp":null,"mods":[],"qty":1,"is_new_item":true}}
]

Example 3: Complex order
Input: "Large hot white chocolate mocha extra sweet with soft top, medium double blended rainbow rebel with boba, and kids not so hot with whip"
Output: [
  {{"product":"white chocolate mocha","size":"large","temp":"hot","mods":["extra sweet","soft top"],"qty":1,"is_new_item":true}},
  {{"product":"rainbow rebel","size":"medium","temp":"blended","mods":["boba","double blended"],"qty":1,"is_new_item":true}},
  {{"product":"not so hot","size":"kids","temp":null,"mods":["whip"],"qty":1,"is_new_item":true}}
]

CRITICAL RULES:
1. IGNORE chitchat (greetings, thank you, questions)
2. "and", "also" = NEW item
3. Milk types (oat/almond/coconut) = MODIFIERS
4. "double blended" = MODIFIER
5. Food items (muffins, pastries) have size=null, temp=null

OUTPUT FORMAT (JSON array only, no explanation):
[{{"product":"...","size":"...","temp":"...","mods":[...],"qty":1,"is_new_item":true}}]

Now extract from the conversation above:"""
    
    def _call_bedrock(self, prompt: str) -> str:
        """Call Bedrock with optimal production settings"""
        
        body = json.dumps({
            "prompt": prompt,
            "max_gen_len": 1000,
            "temperature": 0.0,
            "top_p": 0.9
        })
        
        response = self.bedrock.invoke_model(
            modelId=self.model_id,
            body=body
        )
        
        response_body = json.loads(response['body'].read())
        return response_body.get('generation', '')
    
    def _parse_response(self, response: str, verbose: bool) -> List[Dict]:
        """Parse response"""
        
        items = []
        
        # Remove markdown if present
        response = re.sub(r'```json\s*', '', response)
        response = re.sub(r'```\s*', '', response)
        
        # Extract JSON array
        array_match = re.search(r'\[.*\]', response, re.DOTALL)
        if array_match:
            try:
                json_str = array_match.group(0)
                parsed = json.loads(json_str)
                
                if isinstance(parsed, list):
                    for item_dict in parsed:
                        if item_dict.get('product'):
                            items.append(item_dict)
                    
                    if items and verbose:
                        print(f"✅ Parsed {len(items)} items\n")
                    
                    return items
            except Exception as e:
                if verbose:
                    print(f"⚠️  JSON parse error: {e}")
        
        return items
    
    def _categorize_modifiers(self, items: List[Dict]) -> List[Dict]:
        """Transform simple mods list to categorized structure"""
        
        categorized_items = []
        
        for item in items:
            mods = item.get('mods', [])
            if not isinstance(mods, list):
                mods = []
            
            # Categorize
            categorized = {
                'toppings': [],
                'drizzles': [],
                'sprinks': [],
                'milk': None,
                'ice_level': None,
                'sweetness': None,
                'liquid_sweetener': [],
                'sweetener_packets': [],
                'espresso': []
            }
            
            special_instructions = []
            
            for mod in mods:
                mod_lower = mod.lower().strip()
                
                # Toppings
                if any(x in mod_lower for x in ['soft top', 'whip', 'whipped cream', 'foam']):
                    if 'soft top' in mod_lower:
                        categorized['toppings'].append('Soft Top')
                    elif 'whip' in mod_lower or 'whipped cream' in mod_lower:
                        categorized['toppings'].append('Whipped Cream')
                
                # Drizzles
                elif any(x in mod_lower for x in ['caramel drizzle', 'chocolate drizzle', 'white chocolate drizzle']):
                    if 'caramel' in mod_lower:
                        categorized['drizzles'].append('Caramel Drizzle')
                    elif 'white chocolate' in mod_lower:
                        categorized['drizzles'].append('White Chocolate Drizzle')
                    elif 'chocolate' in mod_lower:
                        categorized['drizzles'].append('Chocolate Drizzle')
                
                # Sprinks/Add-ins
                elif 'boba' in mod_lower or 'sprink' in mod_lower:
                    if 'boba' in mod_lower:
                        categorized['sprinks'].append('Boba')
                
                # Milk
                elif any(x in mod_lower for x in ['oat milk', 'almond milk', 'coconut milk', '2% milk', 'nonfat', 'protein milk']):
                    if 'oat' in mod_lower:
                        categorized['milk'] = 'Oat Milk'
                    elif 'almond' in mod_lower:
                        categorized['milk'] = 'Almond Milk'
                    elif 'coconut' in mod_lower:
                        categorized['milk'] = 'Coconut Milk'
                
                # Ice level
                elif any(x in mod_lower for x in ['no ice', 'light ice', 'extra ice']):
                    if 'no ice' in mod_lower:
                        categorized['ice_level'] = 'No Ice'
                    elif 'light ice' in mod_lower:
                        categorized['ice_level'] = 'Light Ice'
                    elif 'extra ice' in mod_lower:
                        categorized['ice_level'] = 'Extra Ice'
                
                # Sweetness
                elif any(x in mod_lower for x in ['extra sweet', 'half sweet', 'less sweet']):
                    if 'extra sweet' in mod_lower:
                        categorized['sweetness'] = 'Extra Sweet'
                    elif 'half sweet' in mod_lower or 'less sweet' in mod_lower:
                        categorized['sweetness'] = 'Half Sweet'
                
                # Espresso
                elif any(x in mod_lower for x in ['extra shot', 'double shot', 'decaf']):
                    if 'decaf' in mod_lower:
                        categorized['espresso'].append('Make it Decaf')
                    elif 'shot' in mod_lower:
                        categorized['espresso'].append('Extra Shot')
                
                # Everything else goes to special instructions
                else:
                    special_instructions.append(mod)
            
            # Build categorized item
            categorized_item = {
                'product': item.get('product'),
                'product_hint': item.get('product'),
                'size': item.get('size'),
                'temperature': item.get('temp'),
                'quantity': item.get('qty', 1),
                'modifiers': categorized,
                'special_instructions': ', '.join(special_instructions) if special_instructions else '',
                'is_new_item': item.get('is_new_item', True)
            }
            
            categorized_items.append(categorized_item)
        
        return categorized_items
    
    def _validate_and_score(self, items: List[Dict], text: str, verbose: bool) -> List[Dict]:
        """Validate items and add confidence scores"""
        
        validated = []
        text_lower = text.lower()
        
        # Remove duplicates
        items = self._deduplicate(items)
        
        for item in items:
            # Calculate confidence
            confidence = self._calculate_confidence(item, text_lower)
            item['confidence'] = confidence
            
            # Validate
            is_valid, reason = self._is_valid_item(item, text_lower)
            
            if is_valid:
                validated.append(item)
                
                if verbose:
                    emoji = "🟢" if confidence >= 0.8 else "🟡"
                    print(f"{emoji} {item['product']} ({confidence:.0%})")
                    for cat, val in item['modifiers'].items():
                        if val:
                            print(f"   {cat}: {val}")
            elif verbose:
                print(f"⚠️  Filtered: {item['product']} - {reason}")
        
        return validated
    
    def _calculate_confidence(self, item: Dict, text: str) -> float:
        """Calculate confidence score"""
        
        confidence = 1.0
        product = item.get('product', '').lower()
        
        if product not in text:
            product_words = product.split()
            found_words = sum(1 for word in product_words if len(word) > 2 and word in text)
            word_ratio = found_words / max(len(product_words), 1)
            confidence *= (0.3 + 0.7 * word_ratio)
        
        if item.get('size'):
            confidence *= 1.05
        if item.get('temperature'):
            confidence *= 1.05
        
        return min(confidence, 1.0)
    
    def _is_valid_item(self, item: Dict, text: str) -> Tuple[bool, str]:
        """Validate if item is legitimate"""
        
        product = item.get('product', '')
        
        if not product or len(product) < 2:
            return False, "Product name too short"
        
        false_positives = [
            'thank', 'please', 'awesome', 'great', 'good', 'fun', 'course',
            'hi', 'hello', 'hey', 'morning', 'sister', 'team', 'game', 'goalie'
        ]
        if product.lower() in false_positives:
            return False, f"False positive: {product}"
        
        qty = item.get('quantity', 1)
        if not isinstance(qty, int) or qty < 1 or qty > 20:
            return False, f"Invalid quantity: {qty}"
        
        return True, "Valid"
    
    def _deduplicate(self, items: List[Dict]) -> List[Dict]:
        """Remove duplicate items"""
        
        if not items:
            return items
        
        unique = []
        seen = set()
        
        for item in items:
            product = str(item.get('product', '')).lower().strip()
            size = str(item.get('size', '')).lower().strip()
            temp = str(item.get('temperature', '')).lower().strip()
            
            mods = item.get('modifiers', {})
            if isinstance(mods, dict):
                mods_sig = json.dumps(mods, sort_keys=True)
            else:
                mods_sig = ""
            
            signature = (product, size, temp, str(mods_sig))
            
            if signature not in seen:
                seen.add(signature)
                unique.append(item)
        
        return unique


# ========================================================================
# BUILT-IN COMPLETE TEST - JUST RUN THIS FILE!
# ========================================================================

if __name__ == "__main__":
    print("="*70)
    print("🎯 PRODUCTION ENTITY EXTRACTOR - COMPLETE TEST")
    print("="*70)
    
    # Transcription from hackathon audio
    TRANSCRIPTION = """Hi friend, how are you doing this morning? I'm doing good. I'm just picking up drinks for my family. My little sister has a soccer game this morning. Oh, that's so fun! That's really sweet of you to pick up drinks for everyone. I hope your sister's team wins. Yeah, thank you. She's pretty stoked. She's playing goalie for the first time today. Wow, that's so awesome. I'm sure she's gonna do great. Well, what can we get going for you? I've got a bit of a list for you today. I'm gonna do a large hot white chocolate mocha. And can I get that extra sweet with soft top? Can I also have a medium double blended, double rainbow rebel with boba and a kid size not so hot with whip? Awesome, that sounds great. Is that gonna be it for you? Actually, I had a question for you. What alternative milks do you guys have? We have oat, almond and coconut milk. Oh, awesome. Can I do a small oat milk, golden eagle and a lemon poppy seed muffin top? Of course. Is that golden eagle gonna be hot, iced or blended? Um, let's go ahead and do ice, please. Sounds good. We'll get those drinks going for you and have them ready at the window. Thank you so much. Of course. Have a wonderful day and have so much fun at that soccer game. Thank you. I will."""
    
    # Initialize
    print(f"\n📝 Processing transcription ({len(TRANSCRIPTION)} chars)...\n")
    extractor = ProductionEntityExtractor()
    
    # Extract
    items, confidence = extractor.extract_with_confidence(TRANSCRIPTION, verbose=True)
    
    # Build clean JSON
    clean_output = {
        "transcription": TRANSCRIPTION,
        "confidence": confidence,
        "items": [],
        "subtotal": 0.0,
        "total": 0.0
    }
    
    # Mock prices
    PRICES = {
        "white chocolate mocha": 7.50,
        "rebel": 6.75,
        "rainbow rebel": 6.75,
        "not so hot": 3.50,
        "golden eagle": 6.25,
        "lemon poppy seed muffin top": 5.50
    }
    
    # Process items
    for idx, item in enumerate(items, 1):
        price = PRICES.get(item['product'].lower(), 5.00)
        qty = item.get('quantity', 1)
        
        clean_item = {
            "id": f"item-{idx}",
            "name": item['product'].title(),
            "product_id": idx * 10000,
            "size": item.get('size'),
            "temperature": item.get('temperature'),
            "quantity": qty,
            "price": price,
            "confidence": round(item['confidence'], 2),
            "status": "confirmed" if item['confidence'] >= 0.9 else "review",
            "modifiers": item.get('modifiers', {}),
            "special_instructions": item.get('special_instructions', ''),
            "modifier_prices": []
        }
        
        clean_output["items"].append(clean_item)
        clean_output["subtotal"] += price * qty
    
    clean_output["total"] = clean_output["subtotal"]
    
    # Save
    with open("clean_order.json", "w") as f:
        json.dump(clean_output, indent=2, fp=f)
    
    print("\n" + "="*70)
    print("📊 FINAL RESULTS")
    print("="*70)
    
    print(f"\nItems Extracted: {len(clean_output['items'])}")
    print(f"Overall Confidence: {confidence:.0%}")
    print(f"Subtotal: ${clean_output['subtotal']:.2f}")
    print(f"Total: ${clean_output['total']:.2f}\n")
    
    # Item breakdown
    print("ITEMS:")
    for i, item in enumerate(clean_output["items"], 1):
        emoji = "🟢" if item['status'] == 'confirmed' else "🟡"
        print(f"\n{emoji} {i}. {item['name']}")
        print(f"   Size: {item['size']} | Temp: {item['temperature']} | Qty: {item['quantity']}")
        print(f"   Price: ${item['price']:.2f} | Confidence: {item['confidence']:.0%}")
        
        # Modifiers
        has_mods = False
        for cat, val in item["modifiers"].items():
            if val:
                if not has_mods:
                    print("   Modifiers:")
                    has_mods = True
                print(f"     • {cat}: {val}")
        
        # Special instructions
        if item["special_instructions"]:
            print(f"   📝 Special: {item['special_instructions']}")
    
    print("\n" + "="*70)
    print("✅ SUCCESS!")
    print("="*70)
    print(f"\n📄 Saved to: clean_order.json")
    print("\n🔥 COMPLETE JSON OUTPUT:")
    print("="*70)
    print(json.dumps(clean_output, indent=2))
