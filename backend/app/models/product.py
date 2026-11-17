from pydantic import BaseModel, Field
from typing import List, Optional

class VariantModel(BaseModel):
    id: Optional[str] = None
    size: str
    color: str
    hex: Optional[str] = "#000000"
    sku: str
    barcode: Optional[str] = ""
    price: float = Field(..., ge=0)
    mrp: Optional[float] = Field(0, ge=0)

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2)
    category: str
    fabric: Optional[str] = "100% Combed Cotton"
    brand: Optional[str] = ""
    hsn: Optional[str] = "5007"
    price: Optional[float] = Field(0.0, ge=0)
    mrp: Optional[float] = Field(0.0, ge=0)
    gstRate: float = Field(5.0, ge=0)
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    status: Optional[str] = "active"
    variants: List[VariantModel] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    fabric: Optional[str] = None
    brand: Optional[str] = None
    hsn: Optional[str] = None
    price: Optional[float] = None
    mrp: Optional[float] = None
    gstRate: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = None
    variants: Optional[List[VariantModel]] = None

class ProductResponse(BaseModel):
    id: str
    store_id: str
    name: str
    category: str
    fabric: Optional[str] = ""
    brand: Optional[str] = ""
    hsn: Optional[str] = ""
    price: float
    mrp: Optional[float] = 0
    gstRate: float
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    status: str
    variants: List[VariantModel]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
