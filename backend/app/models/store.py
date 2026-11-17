from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class StoreProfile(BaseModel):
    storeName: str
    tagline: Optional[str] = ""
    address: Optional[str] = ""
    city: Optional[str] = "Chennai"
    state: Optional[str] = "Tamil Nadu"
    stateCode: Optional[str] = "33"
    pincode: Optional[str] = "600001"
    phone: Optional[str] = ""
    email: Optional[str] = ""
    gstin: Optional[str] = ""
    pan: Optional[str] = ""

class BillingConfig(BaseModel):
    invoicePrefix: str = "TEX-2026-"
    nextSequence: int = 1001
    defaultGSTRate: float = 5.0
    pricingMode: str = "inclusive" # inclusive | exclusive
    defaultPaperSize: str = "80mm" # 80mm | 58mm | A4
    defaultPaymentMethod: str = "Cash"
    enableRounding: bool = True
    cashierName: str = "Cashier"
    enableAutoCoupons: bool = True
    autoCouponThreshold: float = 2000.0 # Min spend to trigger auto coupon
    autoCouponDiscount: float = 100.0   # Fixed discount on next purchase
    autoCouponMinPurchase: float = 1000.0
    termsAndConditions: Optional[str] = "1. Goods once sold can be exchanged within 7 days in original condition with bill.\n2. Cut-length fabrics & wedding pure silk sarees are non-returnable.\nThank you for shopping with us!"

class SettingsUpdate(BaseModel):
    store: StoreProfile
    billing: BillingConfig
    appearance: Optional[Dict[str, Any]] = {"theme": "light"}
