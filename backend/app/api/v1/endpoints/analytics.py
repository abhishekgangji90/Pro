from fastapi import APIRouter, Depends
from app.core.database import get_database
from app.models.schemas import UserResponse
from app.api.v1.endpoints.auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/dashboard", response_model=dict)
async def get_analytics_dashboard(
    current_user: UserResponse = Depends(get_current_user)
):
    db = get_database()
    products_col = db["products"]
    sales_col = db["sales"]
    
    store_query = {"store_id": current_user.store_id}
    
    # 1. Fetch all products and sales for computation
    products = await products_col.find(store_query).to_list(None)
    sales = await sales_col.find(store_query).to_list(None)
    
    # Overview Metrics
    inventory_value = 0.0
    expired_loss = 0.0
    total_revenue = 0.0
    total_profit = 0.0
    
    stock_distribution = {}
    category_performance = {}
    product_sales = {} # to find top and least selling

    today = datetime.utcnow().date()
    
    for p in products:
        qty = p.get("quantity", 0)
        sell_price = p.get("selling_price", 0.0)
        purch_price = p.get("purchase_price", 0.0)
        cat = p.get("category", "Uncategorized")
        name = p.get("name", "Unknown")
        
        inventory_value += (sell_price * qty)
        
        # Check Expired Loss
        if p.get("status") == "Expired Items":
            expired_loss += (purch_price * qty)
            
        # Initialize stock distribution
        stock_distribution[cat] = stock_distribution.get(cat, 0) + qty
        
        # Initialize product sales dict
        product_sales[str(p["_id"])] = {"name": name, "qty_sold": 0, "revenue": 0.0}

    # Time series data
    daily_sales = {}
    weekly_sales = {}
    monthly_sales = {}
    
    for sale in sales:
        dt = datetime.fromisoformat(sale["created_at"])
        d_str = dt.strftime("%Y-%m-%d")
        w_str = f"{dt.year}-W{dt.isocalendar()[1]:02d}"
        m_str = dt.strftime("%Y-%m")
        
        amt = sale.get("amount", 0.0)
        total_revenue += amt
        
        daily_sales[d_str] = daily_sales.get(d_str, 0.0) + amt
        weekly_sales[w_str] = weekly_sales.get(w_str, 0.0) + amt
        monthly_sales[m_str] = monthly_sales.get(m_str, 0.0) + amt
        
        # Calculate profit and item-level sales from sale.items if present
        items = sale.get("items", [])
        sale_cost = 0.0
        for item in items:
            p_id = item.get("product_id")
            qty = item.get("quantity", 0)
            subtotal = item.get("subtotal", 0.0)
            
            # Find purchase price of item to calculate profit
            # We assume purchase price is stored or we fallback to an estimate (e.g. 70% of selling price)
            p = next((x for x in products if str(x["_id"]) == p_id), None)
            if p:
                sale_cost += (p.get("purchase_price", p.get("selling_price", 0) * 0.7) * qty)
                
                if p_id in product_sales:
                    product_sales[p_id]["qty_sold"] += qty
                    product_sales[p_id]["revenue"] += subtotal
                
                cat = p.get("category", "Uncategorized")
                category_performance[cat] = category_performance.get(cat, 0.0) + subtotal
                
        total_profit += (amt - sale_cost)
        
    # Formatting for Recharts
    format_chart_data = lambda d: [{"name": k, "Sales": round(v, 2)} for k, v in sorted(d.items())]
    
    daily_chart = format_chart_data(daily_sales)[-14:] # Last 14 days
    weekly_chart = format_chart_data(weekly_sales)[-12:] # Last 12 weeks
    monthly_chart = format_chart_data(monthly_sales)[-12:] # Last 12 months
    
    cat_perf_chart = [{"name": k, "Value": round(v, 2)} for k, v in category_performance.items()]
    stock_dist_chart = [{"name": k, "Value": v} for k, v in stock_distribution.items() if v > 0]
    
    # Top/Least selling
    sorted_prods = sorted(product_sales.values(), key=lambda x: x["qty_sold"], reverse=True)
    top_selling = [{"name": p["name"], "Sold": p["qty_sold"]} for p in sorted_prods[:5] if p["qty_sold"] > 0]
    least_selling = [{"name": p["name"], "Sold": p["qty_sold"]} for p in sorted_prods[-5:] if p["qty_sold"] > 0]
    
    # If no items sold, fallback
    if not least_selling:
        least_selling = [{"name": p["name"], "Sold": p["qty_sold"]} for p in sorted_prods[-5:]]
        
    return {
        "overview": {
            "inventory_value": round(inventory_value, 2),
            "expired_loss": round(expired_loss, 2),
            "total_revenue": round(total_revenue, 2),
            "total_profit": round(total_profit, 2),
            "profit_margin": round((total_profit / total_revenue * 100) if total_revenue > 0 else 0, 1)
        },
        "charts": {
            "daily_sales": daily_chart,
            "weekly_sales": weekly_chart,
            "monthly_sales": monthly_chart,
            "category_performance": cat_perf_chart,
            "stock_distribution": stock_dist_chart,
            "top_selling": top_selling,
            "least_selling": least_selling
        }
    }
