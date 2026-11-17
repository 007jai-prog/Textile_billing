from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.database.connection import get_database
from app.services.report_service import get_sales_report
from app.core.dependencies import get_current_store_id

router = APIRouter(prefix="/reports", tags=["Sales & GST Reports"])

@router.get("/sales")
def get_sales_report_endpoint(
    range_type: str = Query("this_month"),
    custom_start: Optional[str] = None,
    custom_end: Optional[str] = None,
    store_id: str = Depends(get_current_store_id)
):
    db = get_database()
    return get_sales_report(db, store_id, range_type, custom_start, custom_end)
