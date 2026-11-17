from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from app.database.connection import get_database
from app.models.festival_offer import FestivalOfferCreate, FestivalOfferUpdate, FestivalOfferResponse
from app.services.festival_service import get_active_festival_offer
from app.core.dependencies import get_current_store_id

router = APIRouter(prefix="/festival-offers", tags=["Festival Offers"])

@router.get("", response_model=List[FestivalOfferResponse])
def get_festival_offers(
    active_only: bool = False,
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()
    query = {"store_id": store_id}
    if active_only:
        query["active"] = True

    cursor = db.festival_offers.find(query).sort("priority", -1)
    results = []
    for doc in cursor:
        doc["id"] = str(doc["_id"])
        results.append(doc)
    return results

@router.post("", response_model=FestivalOfferResponse, status_code=status.HTTP_201_CREATED)
def create_festival_offer(
    payload: FestivalOfferCreate,
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()
    now_iso = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    doc["store_id"] = store_id
    doc["created_at"] = now_iso

    res = db.festival_offers.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return doc

@router.put("/{offer_id}", response_model=FestivalOfferResponse)
def update_festival_offer(
    offer_id: str,
    payload: FestivalOfferUpdate,
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()
    try:
        obj_id = ObjectId(offer_id)
    except Exception:
        obj_id = offer_id

    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
    res = db.festival_offers.update_one({"_id": obj_id, "store_id": store_id}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Festival offer not found.")

    updated = db.festival_offers.find_one({"_id": obj_id, "store_id": store_id})
    updated["id"] = str(updated["_id"])
    return updated

@router.delete("/{offer_id}")
def delete_festival_offer(offer_id: str, store_id: str = Depends(get_current_store_id)):
    db = get_database()
    try:
        obj_id = ObjectId(offer_id)
    except Exception:
        obj_id = offer_id

    res = db.festival_offers.delete_one({"_id": obj_id, "store_id": store_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Festival offer not found.")
    return {"success": True, "message": "Festival offer deleted."}

@router.get("/active-check")
def check_active_festival_offer(
    bill_amount: float = Query(..., ge=0),
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()
    active_offer = get_active_festival_offer(db, store_id, bill_amount)
    return {
        "has_active_offer": bool(active_offer),
        "offer": active_offer
    }
