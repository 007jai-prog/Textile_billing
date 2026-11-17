from datetime import datetime, timezone, timedelta
import random
import string
from typing import Optional, Dict, Any

def validate_and_apply_coupon(
    db,
    store_id: str,
    coupon_code: str,
    bill_subtotal: float,
    customer_id: Optional[str] = None,
    categories: Optional[list] = None
) -> Dict[str, Any]:
    """
    Validates coupon against the in-memory store and calculates the discount.
    """
    clean_code = coupon_code.strip().upper()
    coupon = db.coupons.find_one({
        "store_id": store_id,
        "code": clean_code
    })

    if not coupon:
        return {"valid": False, "error": f"Coupon code '{clean_code}' is invalid."}

    if not coupon.get("active", True):
        return {"valid": False, "error": f"Coupon code '{clean_code}' is inactive."}

    # Date range check
    now_str = datetime.now().strftime("%Y-%m-%d")
    start_date = coupon.get("start_date")
    expiry_date = coupon.get("expiry_date")

    if start_date and now_str < start_date:
        return {"valid": False, "error": f"Coupon '{clean_code}' is not valid yet (Starts {start_date})."}

    if expiry_date and now_str > expiry_date:
        return {"valid": False, "error": f"Coupon '{clean_code}' has expired on {expiry_date}."}

    # Usage limit check
    usage_limit = coupon.get("usage_limit", 100)
    times_used = coupon.get("times_used", 0)
    if times_used >= usage_limit:
        return {"valid": False, "error": f"Coupon '{clean_code}' has reached its maximum usage limit."}

    # Minimum purchase check
    min_purchase = float(coupon.get("min_purchase", 0.0))
    if bill_subtotal < min_purchase:
        return {
            "valid": False,
            "error": f"Coupon '{clean_code}' requires a minimum bill amount of ₹{min_purchase:.2f} (Current: ₹{bill_subtotal:.2f})."
        }

    # Customer-specific check if applicable
    target_cust = coupon.get("customer_id")
    if target_cust and customer_id and target_cust != customer_id:
        return {"valid": False, "error": f"This coupon is exclusively assigned to another registered customer."}

    # Discount calculation
    disc_type = coupon.get("discount_type", "fixed")
    disc_val = float(coupon.get("discount_value", 0.0))
    max_disc = float(coupon.get("max_discount", 0.0))

    discount_amount = 0.0
    if disc_type == "percent":
        discount_amount = (bill_subtotal * disc_val) / 100.0
        if max_disc > 0:
            discount_amount = min(discount_amount, max_disc)
    else:
        discount_amount = min(bill_subtotal, disc_val)

    discount_amount = round(discount_amount, 2)

    return {
        "valid": True,
        "coupon_id": str(coupon["_id"]),
        "code": clean_code,
        "name": coupon.get("name", "Discount Coupon"),
        "discount_type": disc_type,
        "discount_value": disc_val,
        "discount_amount": discount_amount
    }

def generate_automatic_post_sale_coupon(
    db,
    store_id: str,
    invoice_number: str,
    net_payable: float,
    customer_id: Optional[str] = None,
    settings: Optional[dict] = None
) -> Optional[Dict[str, Any]]:
    """
    Automatically creates a unique 'Next Purchase' coupon if bill exceeds threshold
    """
    billing_cfg = (settings or {}).get("billing", {})
    if not billing_cfg.get("enableAutoCoupons", True):
        return None

    threshold = float(billing_cfg.get("autoCouponThreshold", 2000.0))
    if net_payable < threshold:
        return None

    discount_val = float(billing_cfg.get("autoCouponDiscount", 100.0))
    min_purchase = float(billing_cfg.get("autoCouponMinPurchase", 1000.0))

    # Generate random unique 8-character coupon code e.g. TEX-7K9A2
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    coupon_code = f"NEXT-{suffix}"

    expiry = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")

    coupon_doc = {
        "store_id": store_id,
        "code": coupon_code,
        "name": f"Next Visit Reward (Bill #{invoice_number})",
        "description": f"₹{discount_val:.0f} Off on your next purchase above ₹{min_purchase:.0f}",
        "discount_type": "fixed",
        "discount_value": discount_val,
        "min_purchase": min_purchase,
        "max_discount": discount_val,
        "start_date": datetime.now().strftime("%Y-%m-%d"),
        "expiry_date": expiry,
        "usage_limit": 1,
        "times_used": 0,
        "active": True,
        "is_auto_generated": True,
        "customer_id": customer_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    try:
        res = db.coupons.insert_one(coupon_doc)
        return {
            "coupon_id": str(res.inserted_id),
            "code": coupon_code,
            "discount_value": discount_val,
            "min_purchase": min_purchase,
            "expiry_date": expiry
        }
    except Exception:
        return None
