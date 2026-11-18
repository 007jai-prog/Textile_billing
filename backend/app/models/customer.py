from pydantic import BaseModel, Field
from typing import Optional

class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = ""
    city: Optional[str] = "Salem"
    state: Optional[str] = "Tamil Nadu"
    address: Optional[str] = ""
    gstin: Optional[str] = ""
    type: Optional[str] = "Retail" # Retail | B2B

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    type: Optional[str] = None

class CustomerResponse(BaseModel):
    id: str
    store_id: str
    name: str
    phone: str
    email: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    address: Optional[str] = ""
    gstin: Optional[str] = ""
    type: str = "Retail"
    totalPurchases: float = 0.0
    totalBills: int = 0
    lastPurchaseDate: Optional[str] = None
    created_at: Optional[str] = None
