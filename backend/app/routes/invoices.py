from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from app.database.connection import get_database
from app.models.invoice import InvoiceCreate, InvoiceResponse
from app.services.billing_service import process_checkout_and_save
from app.core.dependencies import get_current_user, get_current_store_id

router = APIRouter(prefix="/invoices", tags=["Invoices & Checkout"])

@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def checkout_invoice(
    payload: InvoiceCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    store_id = current_user["store_id"]
    cashier_name = current_user.get("name", "Cashier")

    invoice_doc = process_checkout_and_save(
        db,
        store_id,
        payload.model_dump(),
        cashier_name
    )
    return invoice_doc

@router.get("", response_model=List[InvoiceResponse])
def get_invoices(
    search: Optional[str] = None,
    payment_method: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()
    query = {"store_id": store_id}

    if payment_method and payment_method != "all":
        query["payment.method"] = payment_method

    if start_date and end_date:
        query["date"] = {
            "$gte": f"{start_date}T00:00:00",
            "$lte": f"{end_date}T23:59:59.999999"
        }
    elif start_date:
        query["date"] = {"$gte": f"{start_date}T00:00:00"}

    if search:
        q = search.strip()
        query["$or"] = [
            {"invoiceNumber": {"$regex": q, "$options": "i"}},
            {"customer.name": {"$regex": q, "$options": "i"}},
            {"customer.phone": {"$regex": q, "$options": "i"}}
        ]

    cursor = db.invoices.find(query).sort("date", -1).limit(limit)
    results = []
    for doc in cursor:
        doc["id"] = str(doc["_id"])
        results.append(doc)
    return results

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice_by_id(
    invoice_id: str,
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()
    try:
        doc = db.invoices.find_one({"_id": ObjectId(invoice_id), "store_id": store_id})
    except Exception:
        doc = db.invoices.find_one({"_id": invoice_id, "store_id": store_id})

    if not doc:
        # Check by invoiceNumber
        doc = db.invoices.find_one({"invoiceNumber": invoice_id, "store_id": store_id})

    if not doc:
        raise HTTPException(status_code=404, detail="Invoice record not found.")

    doc["id"] = str(doc["_id"])
    return doc
