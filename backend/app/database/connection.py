import logging
import mongomock
from app.core.config import settings

logger = logging.getLogger("texbill_memory_store")

class Database:
    client = None
    db = None

db_instance = Database()

def seed_default_admin(db):
    try:
        from bson import ObjectId
        from datetime import datetime, timezone
        from app.core.security import get_password_hash

        admin_email = "admin@gmail.com"
        existing = db.users.find_one({"email": admin_email})
        if not existing:
            now_iso = datetime.now(timezone.utc).isoformat()
            store = db.stores.find_one({"name": "ChennaSilks Showroom"})
            if not store:
                store_res = db.stores.insert_one({
                    "name": "ChennaSilks Showroom",
                    "address": "124, Usman Road, T. Nagar",
                    "city": "Chennai",
                    "state": "Tamil Nadu",
                    "stateCode": "33",
                    "pincode": "600017",
                    "gstin": "33AABCS8899K1ZM",
                    "created_at": now_iso
                })
                store_id = str(store_res.inserted_id)
            else:
                store_id = str(store["_id"])

            hashed_pwd = get_password_hash("admin")
            user_res = db.users.insert_one({
                "name": "Admin Store Manager",
                "email": admin_email,
                "phone": "9876543210",
                "hashed_password": hashed_pwd,
                "role": "owner",
                "store_id": store_id,
                "created_at": now_iso
            })
            user_id = str(user_res.inserted_id)

            try:
                db.stores.update_one({"_id": ObjectId(store_id)}, {"$set": {"owner_id": user_id}})
            except Exception:
                db.stores.update_one({"_id": store_id}, {"$set": {"owner_id": user_id}})

            existing_settings = db.settings.find_one({"store_id": store_id})
            if not existing_settings:
                db.settings.insert_one({
                    "store_id": store_id,
                    "store": {
                        "storeName": "ChennaSilks Showroom",
                        "tagline": "Authentic Textile & Apparel Store",
                        "address": "124, Usman Road, T. Nagar",
                        "city": "Chennai",
                        "state": "Tamil Nadu",
                        "stateCode": "33",
                        "pincode": "600017",
                        "phone": "9876543210",
                        "email": admin_email,
                        "gstin": "33AABCS8899K1ZM",
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
                        "cashierName": "Admin Manager",
                        "enableAutoCoupons": True,
                        "autoCouponThreshold": 2000.0,
                        "autoCouponDiscount": 100.0,
                        "autoCouponMinPurchase": 1000.0,
                        "termsAndConditions": "1. Goods once sold can be exchanged within 7 days with original bill.\n2. Cut-length fabrics & pure silk sarees are non-returnable.\nThank you for shopping with us!"
                    },
                    "appearance": {"theme": "light"},
                    "created_at": now_iso
                })
            logger.info("Default admin user (admin@gmail.com / admin) seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding default admin: {e}")

def initialize_memory_store():
    if db_instance.db is None:
        db_instance.client = mongomock.MongoClient()
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        logger.info("Initialized process-local in-memory store")
        seed_default_admin(db_instance.db)

def close_memory_store():
    if db_instance.client:
        db_instance.client.close()
    db_instance.client = None
    db_instance.db = None

def get_database():
    if db_instance.db is None:
        initialize_memory_store()
    else:
        seed_default_admin(db_instance.db)
    return db_instance.db
