from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from app.database.connection import get_database
from app.models.store import SettingsUpdate
from app.core.dependencies import get_current_store_id

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("")
def get_store_settings(store_id: str = Depends(get_current_store_id)):
    db = get_database()
    doc = db.settings.find_one({"store_id": store_id})
    if not doc:
        store = db.stores.find_one({"_id": ObjectId(store_id)}) or {}
        # Return default fallback
        doc = {
            "store_id": store_id,
            "store": {
                "storeName": store.get("name", "Textile Retail Store"),
                "tagline": "Authentic Textile & Apparel Store",
                "address": store.get("address", ""),
                "city": store.get("city", "Chennai"),
                "state": store.get("state", "Tamil Nadu"),
                "stateCode": "33",
                "pincode": store.get("pincode", "600001"),
                "phone": "",
                "email": "",
                "gstin": store.get("gstin", ""),
                "pan": ""
            },
            "billing": {
                "invoicePrefix": "TEX-2026-",
                "nextSequence": 1001,
                "defaultGSTRate": 5.0,
                "pricingMode": "inclusive",
                "defaultPaperSize": "80mm",
                "defaultPaymentMethod": "Cash",
                "enableRounding": True,
                "cashierName": "Cashier",
                "enableAutoCoupons": True,
                "autoCouponThreshold": 2000.0,
                "autoCouponDiscount": 100.0,
                "autoCouponMinPurchase": 1000.0,
                "termsAndConditions": "1. Goods once sold can be exchanged within 7 days with bill.\n2. Cut-length fabrics & pure silk sarees are non-returnable.\nThank you!"
            },
            "appearance": {"theme": "light"}
        }
        db.settings.insert_one(doc)

    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@router.put("")
def update_store_settings(payload: SettingsUpdate, store_id: str = Depends(get_current_store_id)):
    db = get_database()
    update_data = payload.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    db.settings.update_one(
        {"store_id": store_id},
        {"$set": update_data},
        upsert=True
    )

    # Also update stores collection name/address
    db.stores.update_one(
        {"_id": ObjectId(store_id)},
        {"$set": {
            "name": payload.store.storeName,
            "address": payload.store.address,
            "city": payload.store.city,
            "state": payload.store.state,
            "gstin": payload.store.gstin
        }}
    )

    return {"success": True, "message": "Settings updated successfully."}

@router.post("/reset-demo")
def reset_demo_data(store_id: str = Depends(get_current_store_id)):
    """
    OPTIONAL DEMO FEATURE: Populates demo inventory & transactions ONLY if explicitly
    invoked by store admin via Settings button. By default, store starts empty!
    """
    db = get_database()

    # Clear current store data
    db.products.delete_many({"store_id": store_id})
    db.customers.delete_many({"store_id": store_id})
    db.invoices.delete_many({"store_id": store_id})
    db.coupons.delete_many({"store_id": store_id})
    db.festival_offers.delete_many({"store_id": store_id})

    now_iso = datetime.now(timezone.utc).isoformat()

    # Seed 3 Indian Festival Offers
    db.festival_offers.insert_many([
        {
            "store_id": store_id,
            "festival_name": "Pongal Mega Festive Dhamaka",
            "description": "Flat 10% discount on traditional sarees and dhotis",
            "discount_type": "percent",
            "discount_value": 10.0,
            "min_bill_amount": 2000.0,
            "max_discount": 1000.0,
            "start_date": "2026-01-01",
            "end_date": "2026-12-31", # Active for demo testing
            "applicable_categories": ["Sarees", "Dhotis & Veshtis"],
            "priority": 1,
            "active": True,
            "created_at": now_iso
        },
        {
            "store_id": store_id,
            "festival_name": "Diwali Deepavali Special",
            "description": "Flat ₹250 off on purchases above ₹3,000",
            "discount_type": "fixed",
            "discount_value": 250.0,
            "min_bill_amount": 3000.0,
            "max_discount": 250.0,
            "start_date": "2026-10-01",
            "end_date": "2026-11-30",
            "applicable_categories": [],
            "priority": 2,
            "active": True,
            "created_at": now_iso
        }
    ])

    # Seed 3 Promotional Coupons
    db.coupons.insert_many([
        {
            "store_id": store_id,
            "code": "WELCOME10",
            "name": "New Customer Welcome Discount",
            "description": "10% off on first bill above ₹1,500",
            "discount_type": "percent",
            "discount_value": 10.0,
            "min_purchase": 1500.0,
            "max_discount": 500.0,
            "start_date": "2026-01-01",
            "expiry_date": "2026-12-31",
            "usage_limit": 500,
            "times_used": 0,
            "active": True,
            "is_auto_generated": False,
            "created_at": now_iso
        },
        {
            "store_id": store_id,
            "code": "SILK500",
            "name": "Silk Sarees Special Voucher",
            "description": "Flat ₹500 off on pure silk sarees above ₹5,000",
            "discount_type": "fixed",
            "discount_value": 500.0,
            "min_purchase": 5000.0,
            "max_discount": 500.0,
            "start_date": "2026-01-01",
            "expiry_date": "2026-12-31",
            "usage_limit": 200,
            "times_used": 0,
            "active": True,
            "is_auto_generated": False,
            "created_at": now_iso
        }
    ])

    return {
        "success": True,
        "message": "Demo festival offers and coupons initialized for testing."
    }
