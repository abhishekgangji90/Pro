from datetime import datetime, date, timedelta
from app.core.database import get_database

async def send_mock_email(user_email: str, subject: str, body: str):
    print(f" [EMAIL SIMULATION] To: {user_email} | Subject: {subject} | Body: {body}")

async def send_mock_whatsapp(user_phone: str, message: str):
    if not user_phone:
        return
    print(f" [WHATSAPP SIMULATION] To: {user_phone} | Message: {message}")

async def create_notification(store_id: str, title: str, message: str, notif_type: str, severity: str, user_email: str = None, user_phone: str = None):
    db = get_database()
    col = db["notifications"]
    
    doc = {
        "store_id": store_id,
        "title": title,
        "message": message,
        "type": notif_type,
        "severity": severity,
        "is_read": False,
        "created_at": datetime.utcnow().isoformat()
    }
    
    await col.insert_one(doc)
    
    # Send simulated alerts if critical
    if severity == "CRITICAL" and user_email:
        await send_mock_email(user_email, f"URGENT: {title}", message)
        await send_mock_whatsapp(user_phone, f"KiranaPulse Alert: {title}\n{message}")
    elif severity == "WARNING" and user_email:
        await send_mock_email(user_email, title, message)

async def analyze_store_inventory(store_id: str, user_email: str = None, user_phone: str = None):
    """Scan inventory and sales to generate smart alerts."""
    db = get_database()
    prod_col = db["products"]
    sales_col = db["sales"]
    
    products = await prod_col.find({"store_id": store_id}).to_list(1000)
    
    low_stock_count = 0
    out_of_stock_count = 0
    near_expiry_count = 0
    expired_count = 0
    
    for p in products:
        qty = p.get("quantity", 0)
        min_stock = p.get("min_stock", 5)
        name = p.get("name", "Unknown Product")
        
        # Stock checks
        if qty <= 0:
            out_of_stock_count += 1
            await create_notification(store_id, "Out of Stock", f"{name} is completely out of stock.", "ALERT", "CRITICAL", user_email, user_phone)
        elif qty <= min_stock:
            low_stock_count += 1
            await create_notification(store_id, "Low Stock", f"{name} is running low (Qty: {qty}).", "ALERT", "WARNING", user_email, user_phone)
            
        # Expiry checks
        exp_str = p.get("expiry_date")
        if exp_str:
            try:
                exp_date = datetime.strptime(exp_str[:10], "%Y-%m-%d").date()
                days_left = (exp_date - date.today()).days
                if days_left < 0:
                    expired_count += 1
                    await create_notification(store_id, "Product Expired", f"{name} has expired on {exp_date}.", "ALERT", "CRITICAL", user_email, user_phone)
                elif days_left <= 7:
                    near_expiry_count += 1
                    await create_notification(store_id, "Near Expiry", f"{name} will expire in {days_left} days.", "ALERT", "WARNING", user_email, user_phone)
            except Exception:
                pass
                
    # Sales analysis (Fast/Slow moving) - Mock logic based on last 7 days
    last_week = (datetime.utcnow() - timedelta(days=7)).isoformat()
    recent_sales = await sales_col.find({"store_id": store_id, "created_at": {"$gte": last_week}}).to_list(1000)
    
    total_revenue = sum([s.get("amount", 0) for s in recent_sales])
    
    # Weekly Summary
    summary_msg = f"Weekly Summary: You had {len(recent_sales)} transactions totaling ₹{total_revenue:.2f}."
    summary_msg += f" Found {out_of_stock_count} OOS, {low_stock_count} Low Stock, and {near_expiry_count} Near Expiry items."
    
    await create_notification(store_id, "Weekly Store Summary", summary_msg, "SUMMARY", "INFO", user_email, user_phone)
    
    return {"status": "Analysis complete", "alerts_generated": out_of_stock_count + low_stock_count + expired_count + near_expiry_count + 1}
