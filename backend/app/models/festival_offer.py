from pydantic import BaseModel, Field
from typing import Optional, List

class FestivalOfferCreate(BaseModel):
    festival_name: str = Field(..., min_length=2) # e.g. Pongal, Diwali, Tamil New Year, Christmas
    description: Optional[str] = ""
    discount_type: str = Field("percent", pattern="^(percent|fixed)$")
    discount_value: float = Field(..., gt=0)
    min_bill_amount: float = Field(0.0, ge=0)
    max_discount: Optional[float] = Field(0.0, ge=0)
    start_date: str # YYYY-MM-DD
    end_date: str # YYYY-MM-DD
    applicable_categories: Optional[List[str]] = []
    priority: int = Field(1, ge=1)
    active: bool = True

class FestivalOfferUpdate(BaseModel):
    festival_name: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_bill_amount: Optional[float] = None
    max_discount: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    applicable_categories: Optional[List[str]] = None
    priority: Optional[int] = None
    active: Optional[bool] = None

class FestivalOfferResponse(BaseModel):
    id: str
    store_id: str
    festival_name: str
    description: Optional[str] = ""
    discount_type: str
    discount_value: float
    min_bill_amount: float
    max_discount: Optional[float] = 0.0
    start_date: str
    end_date: str
    applicable_categories: List[str] = []
    priority: int = 1
    active: bool = True
    created_at: Optional[str] = None
