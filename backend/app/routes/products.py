from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from app.database.connection import get_database
from app.models.product import ProductCreate, ProductUpdate, ProductResponse
from app.core.dependencies import get_current_user, get_current_store_id

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=List[ProductResponse])
def get_products(
    category: Optional[str] = None,
    fabric: Optional[str] = None,
    search: Optional[str] = None,
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()
    query = {"store_id": store_id}

    if category and category != "All":
        query["category"] = category
    if fabric and fabric != "All":
        query["fabric"] = fabric

    if search:
        q = search.strip()
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"brand": {"$regex": q, "$options": "i"}},
            {"variants.sku": {"$regex": q, "$options": "i"}}
        ]

    cursor = db.products.find(query).sort("created_at", -1)
    results = []
    for doc in cursor:
        doc["id"] = str(doc["_id"])
        results.append(doc)
    return results

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()

    # SKU uniqueness check within this store
    for variant in payload.variants:
        if variant.sku:
            conflict = db.products.find_one({
                "store_id": store_id,
                "variants.sku": variant.sku
            })
            if conflict:
                raise HTTPException(
                    status_code=400,
                    detail=f"SKU code '{variant.sku}' is already assigned to another product ('{conflict.get('name')}')."
                )

    now_iso = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    doc["store_id"] = store_id
    doc["created_at"] = now_iso
    doc["updated_at"] = now_iso

    # Ensure variant IDs
    for idx, v in enumerate(doc.get("variants", [])):
        if not v.get("id"):
            v["id"] = f"v-{int(datetime.now().timestamp())}-{idx+1}"

    res = db.products.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return doc

@router.get("/{product_id}", response_model=ProductResponse)
def get_product_by_id(
    product_id: str,
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()
    try:
        doc = db.products.find_one({"_id": ObjectId(product_id), "store_id": store_id})
    except Exception:
        doc = db.products.find_one({"_id": product_id, "store_id": store_id})

    if not doc:
        raise HTTPException(status_code=404, detail="Product not found in this store")

    doc["id"] = str(doc["_id"])
    return doc

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    payload: ProductUpdate,
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()
    try:
        obj_id = ObjectId(product_id)
    except Exception:
        obj_id = product_id

    existing = db.products.find_one({"_id": obj_id, "store_id": store_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found.")

    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    db.products.update_one({"_id": obj_id, "store_id": store_id}, {"$set": update_data})
    updated = db.products.find_one({"_id": obj_id, "store_id": store_id})
    updated["id"] = str(updated["_id"])
    return updated

@router.delete("/{product_id}")
def delete_product(
    product_id: str,
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()
    try:
        obj_id = ObjectId(product_id)
    except Exception:
        obj_id = product_id

    res = db.products.delete_one({"_id": obj_id, "store_id": store_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found.")

    return {"success": True, "message": "Product removed from catalogue."}
