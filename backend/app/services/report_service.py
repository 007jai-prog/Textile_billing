from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List

def round2(val: float) -> float:
    return round(float(val) + 1e-9, 2)

def get_dashboard_metrics(db, store_id: str) -> Dict[str, Any]:
    today_str = datetime.now().strftime("%Y-%m-%d")

    # Fetch store invoices
    cursor = db.invoices.find({"store_id": store_id}).sort("date", -1)
    invoices = list(cursor)

    today_sales = 0.0
    today_count = 0
    cash_col = 0.0
    upi_col = 0.0
    card_col = 0.0

    all_cash = 0.0
    all_upi = 0.0
    all_card = 0.0

    # 7-day map initialization
    trend_map = {}
    for i in range(6, -1, -1):
        d = datetime.now() - timedelta(days=i)
        key = d.strftime("%Y-%m-%d")
        label = d.strftime("%d %b")
        trend_map[key] = {"date": label, "sales": 0.0, "count": 0}

    product_map = {}

    for inv in invoices:
        inv_date_str = str(inv.get("date", ""))[:10]
        summary = inv.get("summary", {})
        net = float(summary.get("netPayable", 0.0))
        payment = inv.get("payment", {})
        method = payment.get("method", "Cash")

        # Today's metrics
        if inv_date_str == today_str:
            today_sales += net
            today_count += 1
            if method == "Cash":
                cash_col += net
            elif method == "UPI":
                upi_col += net
            elif method == "Card":
                card_col += net
            elif method == "Split" and payment.get("splitDetails"):
                cash_col += float(payment["splitDetails"].get("cash", 0))
                upi_col += float(payment["splitDetails"].get("upi", 0))
                card_col += float(payment["splitDetails"].get("card", 0))

        # All-time payment breakdown
        if method == "Cash":
            all_cash += net
        elif method == "UPI":
            all_upi += net
        elif method == "Card":
            all_card += net
        elif method == "Split" and payment.get("splitDetails"):
            all_cash += float(payment["splitDetails"].get("cash", 0))
            all_upi += float(payment["splitDetails"].get("upi", 0))
            all_card += float(payment["splitDetails"].get("card", 0))

        # 7-day trend
        if inv_date_str in trend_map:
            trend_map[inv_date_str]["sales"] += net
            trend_map[inv_date_str]["count"] += 1

        # Product-wise leaderboard
        for itm in inv.get("items", []):
            p_id = itm.get("productId") or itm.get("name")
            if p_id not in product_map:
                product_map[p_id] = {
                    "id": p_id,
                    "name": itm.get("name", ""),
                    "fabric": itm.get("fabric", "Textile"),
                    "quantity": 0,
                    "revenue": 0.0
                }
            product_map[p_id]["quantity"] += int(itm.get("quantity", 1))
            product_map[p_id]["revenue"] += float(itm.get("lineTotal", 0.0))

    avg_bill = round2(today_sales / today_count) if today_count > 0 else 0.0

    top_products = sorted(product_map.values(), key=lambda x: x["revenue"], reverse=True)[:5]
    for p in top_products:
        p["revenue"] = round2(p["revenue"])

    recent_invoices = []
    for inv in invoices[:6]:
        recent_invoices.append({
            "id": str(inv["_id"]),
            "invoiceNumber": inv.get("invoiceNumber"),
            "date": inv.get("date"),
            "customer": inv.get("customer", {}),
            "payment": inv.get("payment", {}),
            "summary": inv.get("summary", {})
        })

    return {
        "todaySales": round2(today_sales),
        "todayInvoiceCount": today_count,
        "avgBillValue": avg_bill,
        "cashCollection": round2(cash_col),
        "upiCollection": round2(upi_col),
        "cardCollection": round2(card_col),
        "salesTrend": list(trend_map.values()),
        "paymentBreakdown": [
            {"name": "UPI", "value": round2(all_upi), "color": "#4f46e5"},
            {"name": "Cash", "value": round2(all_cash), "color": "#10b981"},
            {"name": "Card", "value": round2(all_card), "color": "#f59e0b"}
        ],
        "topSellingProducts": top_products,
        "recentInvoices": recent_invoices
    }

def get_sales_report(db, store_id: str, range_type: str = "this_month", custom_start: str = None, custom_end: str = None) -> Dict[str, Any]:
    now = datetime.now()
    start_str = now.strftime("%Y-%m-01")
    end_str = now.strftime("%Y-%m-%d")

    if range_type == "today":
        start_str = now.strftime("%Y-%m-%d")
        end_str = now.strftime("%Y-%m-%d")
    elif range_type == "yesterday":
        yest = now - timedelta(days=1)
        start_str = yest.strftime("%Y-%m-%d")
        end_str = yest.strftime("%Y-%m-%d")
    elif range_type == "this_week":
        start_of_week = now - timedelta(days=now.weekday())
        start_str = start_of_week.strftime("%Y-%m-%d")
        end_str = now.strftime("%Y-%m-%d")
    elif range_type == "last_7_days":
        start_str = (now - timedelta(days=6)).strftime("%Y-%m-%d")
        end_str = now.strftime("%Y-%m-%d")
    elif range_type == "this_month":
        start_str = now.strftime("%Y-%m-01")
        end_str = now.strftime("%Y-%m-%d")
    elif range_type == "this_year":
        start_str = now.strftime("%Y-01-01")
        end_str = now.strftime("%Y-%m-%d")
    elif range_type == "custom" and custom_start and custom_end:
        start_str = custom_start
        end_str = custom_end

    all_invoices = list(db.invoices.find({"store_id": store_id}).sort("date", -1))
    invoices = []
    for inv in all_invoices:
        d_str = str(inv.get("date", ""))[:10]
        if d_str and (start_str <= d_str <= end_str):
            invoices.append(inv)

    total_revenue = 0.0
    total_disc = 0.0
    total_taxable = 0.0
    total_cgst = 0.0
    total_sgst = 0.0
    total_tax = 0.0

    cash_col = 0.0
    upi_col = 0.0
    card_col = 0.0

    tax_slabs = {
        5: {"rate": 5, "taxable": 0.0, "cgst": 0.0, "sgst": 0.0, "totalTax": 0.0},
        12: {"rate": 12, "taxable": 0.0, "cgst": 0.0, "sgst": 0.0, "totalTax": 0.0},
        18: {"rate": 18, "taxable": 0.0, "cgst": 0.0, "sgst": 0.0, "totalTax": 0.0}
    }

    product_map = {}

    for inv in invoices:
        summary = inv.get("summary", {})
        net = float(summary.get("netPayable", 0.0))
        total_revenue += net
        total_disc += float(summary.get("totalDiscount", 0.0))
        total_taxable += float(summary.get("taxableSubtotal", 0.0))
        total_cgst += float(summary.get("totalCGST", 0.0))
        total_sgst += float(summary.get("totalSGST", 0.0))
        total_tax += float(summary.get("totalTax", 0.0))

        payment = inv.get("payment", {})
        method = payment.get("method", "Cash")
        if method == "Cash":
            cash_col += net
        elif method == "UPI":
            upi_col += net
        elif method == "Card":
            card_col += net
        elif method == "Split" and payment.get("splitDetails"):
            cash_col += float(payment["splitDetails"].get("cash", 0))
            upi_col += float(payment["splitDetails"].get("upi", 0))
            card_col += float(payment["splitDetails"].get("card", 0))

        for itm in inv.get("items", []):
            rate = int(round(itm.get("gstRate", 5)))
            if rate not in tax_slabs:
                tax_slabs[rate] = {"rate": rate, "taxable": 0.0, "cgst": 0.0, "sgst": 0.0, "totalTax": 0.0}
            tax_slabs[rate]["taxable"] += float(itm.get("taxableAmount", 0.0))
            tax_slabs[rate]["cgst"] += float(itm.get("cgstAmount", 0.0))
            tax_slabs[rate]["sgst"] += float(itm.get("sgstAmount", 0.0))
            tax_slabs[rate]["totalTax"] += float(itm.get("taxAmount", 0.0))

            p_id = itm.get("productId") or itm.get("name")
            if p_id not in product_map:
                product_map[p_id] = {
                    "name": itm.get("name", ""),
                    "sku": itm.get("sku", ""),
                    "fabric": itm.get("fabric", "-"),
                    "unitsSold": 0,
                    "discount": 0.0,
                    "revenue": 0.0
                }
            product_map[p_id]["unitsSold"] += int(itm.get("quantity", 1))
            product_map[p_id]["discount"] += float(itm.get("itemDiscountAmount", 0.0))
            product_map[p_id]["revenue"] += float(itm.get("lineTotal", 0.0))

    slabs_list = []
    for s in tax_slabs.values():
        slabs_list.append({
            "rate": s["rate"],
            "taxable": round2(s["taxable"]),
            "cgst": round2(s["cgst"]),
            "sgst": round2(s["sgst"]),
            "totalTax": round2(s["totalTax"])
        })

    product_sales = sorted(product_map.values(), key=lambda x: x["revenue"], reverse=True)
    for p in product_sales:
        p["discount"] = round2(p["discount"])
        p["revenue"] = round2(p["revenue"])

    return {
        "dateRange": {
            "start": start_str,
            "end": end_str
        },
        "invoiceCount": len(invoices),
        "totalRevenue": round2(total_revenue),
        "totalDiscount": round2(total_disc),
        "totalTaxable": round2(total_taxable),
        "totalCGST": round2(total_cgst),
        "totalSGST": round2(total_sgst),
        "totalTax": round2(total_tax),
        "paymentBreakdown": {
            "cash": round2(cash_col),
            "upi": round2(upi_col),
            "card": round2(card_col)
        },
        "taxSlabs": slabs_list,
        "productSales": product_sales
    }
