from google import genai
from google.genai import types
from app.core.config import settings
from app.core.database import get_database
from datetime import datetime

async def generate_store_context(store_id: str) -> str:
    """Fetch current inventory and sales to provide context to the LLM."""
    db = get_database()
    prod_col = db["products"]
    sales_col = db["sales"]
    
    # Fetch inventory
    products = await prod_col.find({"store_id": store_id}).to_list(1000)
    
    low_stock = []
    expired = []
    total_value = 0
    
    for p in products:
        qty = p.get("quantity", 0)
        name = p.get("name", "Unknown")
        min_stock = p.get("min_stock", 5)
        total_value += (p.get("selling_price", 0) * qty)
        
        if qty <= min_stock:
            low_stock.append(f"{name} (Qty: {qty}, Min: {min_stock})")
            
        if p.get("status") in ["Expired Items", "Near Expiry"]:
            expired.append(f"{name} ({p.get('status')})")
            
    # Fetch today's sales
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    recent_sales = await sales_col.find({
        "store_id": store_id,
        "created_at": {"$gte": today_str}
    }).to_list(100)
    
    today_revenue = sum([s.get("amount", 0) for s in recent_sales])
    
    # Build context string
    context = f"""
STORE CONTEXT SNAPSHOT (Real-time):
- Total Products Configured: {len(products)}
- Total Inventory Value: ₹{total_value}
- Today's Revenue: ₹{today_revenue}
- Items needing Reorder (Low Stock): {', '.join(low_stock) if low_stock else 'None'}
- Items Expiring/Expired: {', '.join(expired) if expired else 'None'}
"""
    return context

async def process_chat_message(store_id: str, message: str, history: list) -> str:
    """Process a user message using Gemini with store context."""
    if not settings.GEMINI_API_KEY:
        return "AI features are disabled because GEMINI_API_KEY is not configured."
        
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    # Generate real-time context
    context = await generate_store_context(store_id)
    
    system_instruction = f"""
You are the KiranaPulse AI Business Assistant. You help store owners manage their inventory, analyze sales, and make business decisions.
You have access to their real-time store data. Use it to answer their questions accurately. Be concise, professional, and helpful.
Do not hallucinate data. If you don't know something based on the context, politely say so.

{context}
"""
    
    # Convert history to Gemini format (optional, or just pass as text for simplicity)
    # We will pass recent history as text in the prompt to keep it simple and robust.
    history_text = "RECENT CONVERSATION HISTORY:\n"
    for msg in history[-5:]: # Keep last 5 messages for context
        role = "Store Owner" if msg["role"] == "user" else "AI Assistant"
        history_text += f"{role}: {msg['content']}\n"
        
    full_prompt = f"{system_instruction}\n\n{history_text}\nStore Owner: {message}\nAI Assistant:"
    
    try:
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=full_prompt
        )
        return response.text.strip()
    except Exception as e:
        print("Gemini Chat Error:", e)
        return "I'm sorry, I encountered an error while analyzing your request. Please try again later."
