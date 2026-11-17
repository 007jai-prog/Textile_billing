from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class InvoiceLineItem(BaseModel):
    id: str # variant id
    productId: str
    name: str
    sku: Optional[str] = ""
    barcode: Optional[str] = ""
    size: str
    color: Optional[str] = ""
    fabric: Optional[str] = ""
    quantity: int = Field(..., ge=1)
    unitPrice: float = Field(..., ge=0)
    grossAmount: float = Field(..., ge=0)
    discountType: Optional[str] = "fixed"
    discountValue: Optional[float] = 0.0
    itemDiscountAmount: Optional[float] = 0.0
    gstRate: float = 5.0
    taxableAmount: float = 0.0
    taxAmount: float = 0.0
    cgstRate: float = 2.5
    cgstAmount: float = 0.0
    sgstRate: float = 2.5
    sgstAmount: float = 0.0
    lineTotal: float = 0.0

class InvoicePayment(BaseModel):
    method: str = Field(..., pattern="^(Cash|UPI|Card|Split)$")
    reference: Optional[str] = ""
    amountReceived: float = Field(..., ge=0)
    changeReturned: float = Field(0.0, ge=0)
    splitDetails: Optional[Dict[str, float]] = None

class InvoiceSummary(BaseModel):
    totalItems: int
    totalQuantity: int
    grossSubtotal: float
    totalItemDiscount: float = 0.0
    billDiscountAmount: float = 0.0
    couponDiscountAmount: float = 0.0
    festivalDiscountAmount: float = 0.0
    totalDiscount: float = 0.0
    taxableSubtotal: float
    totalTax: float
    totalCGST: float
    totalSGST: float
    grandTotal: float
    roundOff: float = 0.0
    netPayable: float

class InvoiceCreate(BaseModel):
    customer: Optional[Dict[str, Any]] = None
    items: List[InvoiceLineItem] = Field(..., min_length=1)
    billDiscount: Optional[Dict[str, Any]] = {"type": "fixed", "value": 0}
    coupon_code: Optional[str] = None
    payment: InvoicePayment
    notes: Optional[str] = ""

class InvoiceResponse(BaseModel):
    id: str
    store_id: str
    invoiceNumber: str
    date: str
    customer: Dict[str, Any]
    items: List[InvoiceLineItem]
    summary: InvoiceSummary
    payment: InvoicePayment
    applied_coupon: Optional[Dict[str, Any]] = None
    applied_festival: Optional[Dict[str, Any]] = None
    generated_coupon: Optional[Dict[str, Any]] = None
    cashier: str = "Cashier"
    notes: Optional[str] = ""
    status: str = "Completed"
    created_at: Optional[str] = None
