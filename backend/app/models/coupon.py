from pydantic import BaseModel, Field
from typing import Optional, List

class CouponCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=30)
    name: Optional[str] = ""
    description: Optional[str] = ""
    discount_type: str = Field(..., pattern="^(percent|fixed)$")
    discount_value: float = Field(..., gt=0)
    min_purchase: Optional[float] = 0.0
    min_bill_amount: Optional[float] = None
    max_discount: Optional[float] = 0.0
    max_discount_amount: Optional[float] = None
    start_date: Optional[str] = None
    valid_from: Optional[str] = None
    expiry_date: Optional[str] = None
    valid_until: Optional[str] = None
    usage_limit: Optional[int] = 100
    max_uses: Optional[int] = None
    applicable_categories: Optional[List[str]] = []
    active: Optional[bool] = True
    is_active: Optional[bool] = None
    customer_id: Optional[str] = None
    is_auto_generated: bool = False

class CouponUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_purchase: Optional[float] = None
    min_bill_amount: Optional[float] = None
    max_discount: Optional[float] = None
    max_discount_amount: Optional[float] = None
    start_date: Optional[str] = None
    valid_from: Optional[str] = None
    expiry_date: Optional[str] = None
    valid_until: Optional[str] = None
    usage_limit: Optional[int] = None
    max_uses: Optional[int] = None
    applicable_categories: Optional[List[str]] = None
    active: Optional[bool] = None
    is_active: Optional[bool] = None

class CouponValidateRequest(BaseModel):
    code: str
    cart_total: float
    customer_id: Optional[str] = None
    categories: Optional[List[str]] = []

class CouponResponse(BaseModel):
    id: str
    store_id: str
    code: str
    name: Optional[str] = ""
    description: Optional[str] = ""
    discount_type: str
    discount_value: float
    min_purchase: Optional[float] = 0.0
    min_bill_amount: Optional[float] = 0.0
    max_discount: Optional[float] = 0.0
    max_discount_amount: Optional[float] = 0.0
    start_date: Optional[str] = None
    valid_from: Optional[str] = None
    expiry_date: Optional[str] = None
    valid_until: Optional[str] = None
    usage_limit: Optional[int] = 100
    max_uses: Optional[int] = 100
    times_used: int = 0
    active: Optional[bool] = True
    is_active: Optional[bool] = True
    is_auto_generated: bool = False
    customer_id: Optional[str] = None
    created_at: Optional[str] = None
