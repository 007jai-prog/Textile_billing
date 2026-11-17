from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from app.database.connection import get_database
from app.models.coupon import CouponCreate, CouponUpdate, CouponResponse, CouponValidateRequest
from app.services.coupon_service import validate_and_apply_coupon
from app.core.dependencies import get_current_store_id

router = APIRouter(prefix="/coupons", tags=["Coupons & Offers"])

def _normalize_coupon(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    doc["name"] = doc.get("name") or doc.get("description") or doc.get("code", "")
    min_amt = float(doc.get("min_purchase") or doc.get("min_bill_amount") or 0.0)
    doc["min_purchase"] = min_amt
    doc["min_bill_amount"] = min_amt
    max_disc = float(doc.get("max_discount") or doc.get("max_discount_amount") or 0.0)
    doc["max_discount"] = max_disc
    doc["max_discount_amount"] = max_disc
    exp = doc.get("expiry_date") or doc.get("valid_until")
    doc["expiry_date"] = exp
    doc["valid_until"] = exp
    u_lim = int(doc.get("usage_limit") or doc.get("max_uses") or 100)
    doc["usage_limit"] = u_lim
    doc["max_uses"] = u_lim
    is_act = doc.get("active") if doc.get("active") is not None else doc.get("is_active", True)
    doc["active"] = is_act
    doc["is_active"] = is_act
    return doc

@router.get("", response_model=List[CouponResponse])
def get_coupons(
    active_only: bool = False,
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()
    query = {"store_id": store_id}
    if active_only:
        query["$or"] = [{"active": True}, {"is_active": True}]

    cursor = db.coupons.find(query).sort("created_at", -1)
    results = []
    for doc in cursor:
        results.append(_normalize_coupon(doc))
    return results

@router.post("", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
def create_coupon(payload: CouponCreate, store_id: str = Depends(get_current_store_id)):
    db = get_database()
    code_clean = payload.code.strip().upper()

    # Check unique code in store
    existing = db.coupons.find_one({"store_id": store_id, "code": code_clean})
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Coupon code '{code_clean}' already exists in this store."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    doc["store_id"] = store_id
    doc["code"] = code_clean
    doc["times_used"] = 0
    doc["created_at"] = now_iso

    res = db.coupons.insert_one(doc)
    doc["_id"] = res.inserted_id
    return _normalize_coupon(doc)

@router.put("/{coupon_id}", response_model=CouponResponse)
def update_coupon(
    coupon_id: str,
    payload: CouponUpdate,
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()
    try:
        obj_id = ObjectId(coupon_id)
    except Exception:
        obj_id = coupon_id

    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
    res = db.coupons.update_one({"_id": obj_id, "store_id": store_id}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found.")

    updated = db.coupons.find_one({"_id": obj_id, "store_id": store_id})
    return _normalize_coupon(updated)

@router.delete("/{coupon_id}")
def delete_coupon(coupon_id: str, store_id: str = Depends(get_current_store_id)):
    db = get_database()
    try:
        obj_id = ObjectId(coupon_id)
    except Exception:
        obj_id = coupon_id

    res = db.coupons.delete_one({"_id": obj_id, "store_id": store_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found.")
    return {"status": "success", "message": "Coupon deleted."}

@router.post("/validate")
def validate_coupon(
    payload: CouponValidateRequest,
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()
    result = validate_and_apply_coupon(
        db,
        store_id,
        payload.code,
        payload.cart_total,
        payload.customer_id,
        payload.categories
    )
    return result

@router.get("/redemptions")
def get_redemptions(
    limit: int = 50,
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()
    invoices = db.invoices.find(
        {"store_id": store_id, "applied_coupon": {"$ne": None}},
        {"invoiceNumber": 1, "date": 1, "applied_coupon": 1, "customer": 1}
    ).sort("date", -1).limit(limit)

    results = []
    for inv in invoices:
        results.append({
            "id": str(inv["_id"]),
            "invoiceNumber": inv.get("invoiceNumber"),
            "date": inv.get("date"),
            "coupon": inv.get("applied_coupon"),
            "customer": inv.get("customer")
        })
    return results
