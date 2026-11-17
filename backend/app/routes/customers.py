from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from app.database.connection import get_database
from app.models.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.core.dependencies import get_current_store_id

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerResponse])
def get_customers(
    search: Optional[str] = None,
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()
    query = {"store_id": store_id}

    if search:
        q = search.strip()
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"phone": {"$regex": q, "$options": "i"}},
            {"city": {"$regex": q, "$options": "i"}},
            {"gstin": {"$regex": q, "$options": "i"}}
        ]

    cursor = db.customers.find(query).sort("created_at", -1)
    results = []
    for doc in cursor:
        doc["id"] = str(doc["_id"])
        results.append(doc)
    return results

@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()

    # Check existing phone in this store
    existing = db.customers.find_one({"store_id": store_id, "phone": payload.phone.strip()})
    if existing:
        existing["id"] = str(existing["_id"])
        return existing

    now_iso = datetime.now(timezone.utc).isoformat()
    doc = payload.model_dump()
    doc["store_id"] = store_id
    doc["totalPurchases"] = 0.0
    doc["totalBills"] = 0
    doc["lastPurchaseDate"] = None
    doc["created_at"] = now_iso

    res = db.customers.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return doc

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: str, store_id: str = Depends(get_current_store_id)):
    db = get_database()
    try:
        doc = db.customers.find_one({"_id": ObjectId(customer_id), "store_id": store_id})
    except Exception:
        doc = db.customers.find_one({"_id": customer_id, "store_id": store_id})

    if not doc:
        raise HTTPException(status_code=404, detail="Customer not found.")
    doc["id"] = str(doc["_id"])
    return doc

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: str,
    payload: CustomerUpdate,
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()
    try:
        obj_id = ObjectId(customer_id)
    except Exception:
        obj_id = customer_id

    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
    res = db.customers.update_one({"_id": obj_id, "store_id": store_id}, {"$set": update_data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found.")

    updated = db.customers.find_one({"_id": obj_id, "store_id": store_id})
    updated["id"] = str(updated["_id"])
    return updated

@router.delete("/{customer_id}")
def delete_customer(customer_id: str, store_id: str = Depends(get_current_store_id)):
    db = get_database()
    try:
        obj_id = ObjectId(customer_id)
    except Exception:
        obj_id = customer_id

    res = db.customers.delete_one({"_id": obj_id, "store_id": store_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found.")
    return {"success": True, "message": "Customer removed."}

@router.get("/{customer_id}/history")
def get_customer_history(customer_id: str, store_id: str = Depends(get_current_store_id)):
    db = get_database()
    invoices = list(db.invoices.find({
        "store_id": store_id,
        "customer.id": customer_id
    }).sort("date", -1))

    for inv in invoices:
        inv["id"] = str(inv["_id"])
    return invoices
