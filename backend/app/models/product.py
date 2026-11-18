from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class VariantModel(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: Optional[str] = None
    size: Optional[str] = "Free Size"
    color: Optional[str] = "Standard"
    hex: Optional[str] = "#000000"
    sku: Optional[str] = ""
    barcode: Optional[str] = ""
    price: float = Field(0.0, ge=0)
    mrp: Optional[float] = Field(0.0, ge=0)
    priceOverride: Optional[bool] = False
    mrpOverride: Optional[bool] = False

class ProductCreate(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: Optional[str] = None
    name: str = Field(..., min_length=1)
    category: Optional[str] = "Sarees"
    fabric: Optional[str] = "Kanchipuram Silk"
    brand: Optional[str] = ""
    hsn: Optional[str] = "5007"
    price: Optional[float] = Field(0.0, ge=0)
    mrp: Optional[float] = Field(0.0, ge=0)
    gstRate: Optional[float] = Field(5.0, ge=0)
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    status: Optional[str] = "active"
    variants: List[VariantModel] = []

class ProductUpdate(BaseModel):
    model_config = ConfigDict(extra="allow")

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
    model_config = ConfigDict(extra="allow")

    id: str
    store_id: Optional[str] = ""
    name: str
    category: Optional[str] = "General"
    fabric: Optional[str] = ""
    brand: Optional[str] = ""
    hsn: Optional[str] = "5007"
    price: float = 0.0
    mrp: Optional[float] = 0.0
    gstRate: float = 5.0
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    status: Optional[str] = "active"
    variants: List[VariantModel] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
