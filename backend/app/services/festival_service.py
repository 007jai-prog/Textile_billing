from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

def get_active_festival_offer(db, store_id: str, cart_gross_total: float, item_categories: List[str] = None) -> Optional[Dict[str, Any]]:
    """
    Finds highest-priority active festival offer valid for the current calendar date.
    """
    today_str = datetime.now().strftime("%Y-%m-%d")

    cursor = db.festival_offers.find({
        "store_id": store_id,
        "active": True,
        "start_date": {"$lte": today_str},
        "end_date": {"$gte": today_str}
    }).sort("priority", -1)

    for offer in cursor:
        min_bill = float(offer.get("min_bill_amount", 0.0))
        if cart_gross_total < min_bill:
            continue

        # Check category restrictions if specified
        applicable_cats = offer.get("applicable_categories", [])
        if applicable_cats and item_categories:
            matching = [c for c in item_categories if c in applicable_cats]
            if not matching:
                continue

        # Calculate discount
        disc_type = offer.get("discount_type", "percent")
        disc_val = float(offer.get("discount_value", 0.0))
        max_disc = float(offer.get("max_discount", 0.0))

        discount_amount = 0.0
        if disc_type == "percent":
            discount_amount = (cart_gross_total * disc_val) / 100.0
            if max_disc > 0:
                discount_amount = min(discount_amount, max_disc)
        else:
            discount_amount = min(cart_gross_total, disc_val)

        discount_amount = round(discount_amount, 2)

        return {
            "offer_id": str(offer["_id"]),
            "festival_name": offer.get("festival_name", "Festival Special"),
            "discount_type": disc_type,
            "discount_value": disc_val,
            "discount_amount": discount_amount
        }

    return None
