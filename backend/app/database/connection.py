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
            store = db.stores.find_one({"name": "Lady Avenue Showroom"})
            if not store:
                store_res = db.stores.insert_one({
                    "name": "Lady Avenue Showroom",
                    "address": "124, Usman Road, T. Nagar",
                    "city": "Salem",
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
                        "storeName": "Lady Avenue Showroom",
                        "tagline": "Authentic Textile & Apparel Store",
                        "address": "124, Usman Road, T. Nagar",
                        "city": "Salem",
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
            seed_initial_products(db, store_id)
            logger.info("Default admin user (admin@gmail.com / admin) seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding default admin: {e}")

def seed_initial_products(db, store_id: str):
    try:
        if db.products.count_documents({"store_id": store_id}) > 0:
            return

        from datetime import datetime, timezone
        now_iso = datetime.now(timezone.utc).isoformat()

        initial_products = [
            {
                "store_id": store_id,
                "name": "Kanchipuram Pure Silk Wedding Saree",
                "category": "Sarees",
                "fabric": "Kanchipuram Silk",
                "brand": "Lady Avenue Heritage",
                "hsn": "5007",
                "price": 15499.0,
                "mrp": 18500.0,
                "gstRate": 5.0,
                "description": "Traditional zari rich pallu saree with authentic temple border design.",
                "image_url": "",
                "status": "active",
                "created_at": now_iso,
                "updated_at": now_iso,
                "variants": [
                    {"id": "v-init-101", "sku": "KPS-MRN-FS", "barcode": "890100100101", "size": "Free Size", "color": "Maroon Gold", "hex": "#800000", "price": 15499.0, "mrp": 18500.0},
                    {"id": "v-init-102", "sku": "KPS-PEA-FS", "barcode": "890100100102", "size": "Free Size", "color": "Peacock Blue", "hex": "#005f73", "price": 15499.0, "mrp": 18500.0},
                ]
            },
            {
                "store_id": store_id,
                "name": "Pure Linen Casual Shirt",
                "category": "Men's Casual",
                "fabric": "Linen",
                "brand": "Lady Avenue Club",
                "hsn": "6205",
                "price": 1899.0,
                "mrp": 2499.0,
                "gstRate": 5.0,
                "description": "Breathable pure linen slim-fit collared shirt.",
                "image_url": "",
                "status": "active",
                "created_at": now_iso,
                "updated_at": now_iso,
                "variants": [
                    {"id": "v-init-103", "sku": "LIN-SHT-WHT-M", "barcode": "890100100103", "size": "M", "color": "Crisp White", "hex": "#f8fafc", "price": 1899.0, "mrp": 2499.0},
                    {"id": "v-init-104", "sku": "LIN-SHT-WHT-L", "barcode": "890100100104", "size": "L", "color": "Crisp White", "hex": "#f8fafc", "price": 1899.0, "mrp": 2499.0},
                    {"id": "v-init-105", "sku": "LIN-SHT-SKY-M", "barcode": "890100100105", "size": "M", "color": "Sky Blue", "hex": "#38bdf8", "price": 1899.0, "mrp": 2499.0},
                ]
            },
            {
                "store_id": store_id,
                "name": "Traditional Cotton Dhoti with Mayilkann Border",
                "category": "Dhotis & Veshtis",
                "fabric": "100% Combed Cotton",
                "brand": "Lady Avenue Heritage",
                "hsn": "5208",
                "price": 899.0,
                "mrp": 1200.0,
                "gstRate": 5.0,
                "description": "8 Muzham pure cotton traditional dhoti with peacock gold zari border.",
                "image_url": "",
                "status": "active",
                "created_at": now_iso,
                "updated_at": now_iso,
                "variants": [
                    {"id": "v-init-106", "sku": "DHT-MYL-9X5", "barcode": "890100100106", "size": "9 x 5 (Double)", "color": "Off White Gold", "hex": "#fef08a", "price": 899.0, "mrp": 1200.0},
                ]
            },
            {
                "store_id": store_id,
                "name": "Chanderi Silk Anarkali Kurti",
                "category": "Women's Kurtis",
                "fabric": "Chanderi Silk",
                "brand": "Lady Avenue Heritage",
                "hsn": "6204",
                "price": 2499.0,
                "mrp": 3299.0,
                "gstRate": 5.0,
                "description": "Graceful printed floral Chanderi silk kurti with hand embroidered yoke.",
                "image_url": "",
                "status": "active",
                "created_at": now_iso,
                "updated_at": now_iso,
                "variants": [
                    {"id": "v-init-107", "sku": "CHK-FLR-M", "barcode": "890100100107", "size": "M", "color": "Mustard Yellow", "hex": "#eab308", "price": 2499.0, "mrp": 3299.0},
                    {"id": "v-init-108", "sku": "CHK-FLR-L", "barcode": "890100100108", "size": "L", "color": "Mustard Yellow", "hex": "#eab308", "price": 2499.0, "mrp": 3299.0},
                ]
            }
        ]

        db.products.insert_many(initial_products)
        logger.info(f"Seeded {len(initial_products)} initial textile products.")
    except Exception as err:
        logger.error(f"Error seeding products: {err}")

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
