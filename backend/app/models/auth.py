from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserRegister(BaseModel):
    owner_name: str = Field(..., min_length=2, max_length=100)
    store_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6)
    store_address: Optional[str] = ""
    city: Optional[str] = "Chennai"
    state: Optional[str] = "Tamil Nadu"
    pincode: Optional[str] = "600001"
    gstin: Optional[str] = ""

class UserLogin(BaseModel):
    identifier: str # Email or mobile
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: str
    role: str
    store_id: str
    store_name: str

class OAuthCallbackPayload(BaseModel):
    provider: str # "google" | "microsoft"
    code: str
    redirect_uri: Optional[str] = None

class OAuthCompleteSetupPayload(BaseModel):
    email: EmailStr
    name: str
    provider: str
    provider_id: str
    store_name: str = Field(..., min_length=2, max_length=150)
    phone: str = Field(..., min_length=10, max_length=15)
    store_address: Optional[str] = ""
    city: Optional[str] = "Chennai"
    state: Optional[str] = "Tamil Nadu"
    pincode: Optional[str] = "600001"
    gstin: Optional[str] = ""

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)
