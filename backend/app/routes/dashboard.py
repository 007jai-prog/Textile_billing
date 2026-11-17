from fastapi import APIRouter, Depends
from app.database.connection import get_database
from app.services.report_service import get_dashboard_metrics
from app.core.dependencies import get_current_store_id

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics")
def get_metrics(store_id: str = Depends(get_current_store_id)):
    db = get_database()
    return get_dashboard_metrics(db, store_id)
