from datetime import datetime, timezone
import json
import urllib.request
import urllib.parse
import secrets
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from app.database.connection import get_database
from app.core.config import settings
from app.models.auth import (
    UserRegister,
    UserLogin,
    Token,
    UserResponse,
    OAuthCallbackPayload,
    OAuthCompleteSetupPayload,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user_and_store(payload: UserRegister):
    db = get_database()

    # 1. Prevent duplicate email
    existing_user = db.users.find_one({"email": payload.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email '{payload.email}' already exists. Please login."
        )

    # 2. Prevent duplicate phone
    existing_phone = db.users.find_one({"phone": payload.phone})
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with phone number '{payload.phone}' already exists."
        )

    now_iso = datetime.now(timezone.utc).isoformat()

    # 3. Create Store record
    store_doc = {
        "name": payload.store_name,
        "address": payload.store_address,
        "city": payload.city or "Salem",
        "state": payload.state or "Tamil Nadu",
        "stateCode": "33",
        "pincode": payload.pincode or "600001",
        "gstin": payload.gstin or "",
        "created_at": now_iso
    }
    store_res = db.stores.insert_one(store_doc)
    store_id = str(store_res.inserted_id)

    # 4. Hash password & create Owner User
    hashed_pwd = get_password_hash(payload.password)
    user_doc = {
        "name": payload.owner_name,
        "email": payload.email.lower(),
        "phone": payload.phone,
        "hashed_password": hashed_pwd,
        "role": "owner",
        "store_id": store_id,
        "created_at": now_iso
    }
    user_res = db.users.insert_one(user_doc)
    user_id = str(user_res.inserted_id)

    # Link owner_id to store
    db.stores.update_one({"_id": store_res.inserted_id}, {"$set": {"owner_id": user_id}})

    # 5. Initialize Store Settings (Billing & Profile)
    settings_doc = {
        "store_id": store_id,
        "store": {
            "storeName": payload.store_name,
            "tagline": "Authentic Textile & Apparel Store",
            "address": payload.store_address,
            "city": payload.city or "Salem",
            "state": payload.state or "Tamil Nadu",
            "stateCode": "33",
            "pincode": payload.pincode or "600001",
            "phone": payload.phone,
            "email": payload.email,
            "gstin": payload.gstin or "",
            "pan": ""
        },
        "billing": {
            "invoicePrefix": "TEX-2026-",
            "nextSequence": 1001,
            "defaultGSTRate": 5.0,
            "pricingMode": "inclusive",
            "defaultPaperSize": "80mm",
            "defaultPaymentMethod": "Cash",
            "enableRounding": True,
            "cashierName": payload.owner_name,
            "enableAutoCoupons": True,
            "autoCouponThreshold": 2000.0,
            "autoCouponDiscount": 100.0,
            "autoCouponMinPurchase": 1000.0,
            "termsAndConditions": "1. Goods once sold can be exchanged within 7 days with original bill.\n2. Cut-length fabrics & pure silk sarees are non-returnable.\nThank you for shopping with us!"
        },
        "appearance": {"theme": "light"},
        "created_at": now_iso
    }
    db.settings.insert_one(settings_doc)

    return {
        "success": True,
        "message": f"Store '{payload.store_name}' and owner account registered successfully. Please login to continue.",
        "email": payload.email
    }

@router.post("/login", response_model=Token)
def login_user(payload: UserLogin):
    db = get_database()
    identifier = payload.identifier.strip().lower()
    search_email = "admin@gmail.com" if identifier == "admin" else identifier

    # Search by email or phone
    user = db.users.find_one({
        "$or": [
            {"email": search_email},
            {"phone": payload.identifier.strip()}
        ]
    })

    if not user or not verify_password(payload.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/mobile or password. Please verify your credentials."
        )

    store = db.stores.find_one({"_id": ObjectId(user["store_id"])}) or {}

    token_data = {
        "sub": str(user["_id"]),
        "store_id": str(user["store_id"]),
        "email": user["email"],
        "role": user.get("role", "cashier")
    }
    token = create_access_token(token_data)

    user_info = {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "phone": user.get("phone", ""),
        "role": user.get("role", "owner"),
        "store_id": str(user["store_id"]),
        "store_name": store.get("name", "Textile Retail Store")
    }

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_info
    }

@router.get("/me", response_model=UserResponse)
def get_profile(current_user: dict = Depends(get_current_user)):
    db = get_database()
    store = db.stores.find_one({"_id": ObjectId(current_user["store_id"])}) or {}
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user.get("name", ""),
        "phone": current_user.get("phone", ""),
        "role": current_user.get("role", "cashier"),
        "store_id": current_user["store_id"],
        "store_name": store.get("name", "Textile Retail Store")
    }

# --- Google & Microsoft OAuth 2.0 / OpenID Connect Endpoints ---

@router.get("/oauth/google/url")
def get_google_auth_url(redirect_uri: Optional[str] = None):
    r_uri = redirect_uri or settings.OAUTH_FRONTEND_REDIRECT_URI
    if not settings.GOOGLE_CLIENT_ID:
        encoded_uri = urllib.parse.quote(r_uri, safe="")
        return {
            "configured": False,
            "url": f"https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_GOOGLE_CLIENT_ID&redirect_uri={encoded_uri}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent&state=google",
            "message": "Google OAuth Client ID is not configured yet. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env"
        }
    encoded_uri = urllib.parse.quote(r_uri, safe="")
    url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={settings.GOOGLE_CLIENT_ID}&redirect_uri={encoded_uri}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent&state=google"
    return {"configured": True, "url": url}

@router.get("/oauth/microsoft/url")
def get_microsoft_auth_url(redirect_uri: Optional[str] = None):
    r_uri = redirect_uri or settings.OAUTH_FRONTEND_REDIRECT_URI
    if not settings.MICROSOFT_CLIENT_ID:
        encoded_uri = urllib.parse.quote(r_uri, safe="")
        return {
            "configured": False,
            "url": f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=YOUR_MICROSOFT_CLIENT_ID&redirect_uri={encoded_uri}&response_type=code&scope=openid%20email%20profile%20User.Read&response_mode=query&state=microsoft",
            "message": "Microsoft OAuth Client ID is not configured yet. Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in backend/.env"
        }
    encoded_uri = urllib.parse.quote(r_uri, safe="")
    url = f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id={settings.MICROSOFT_CLIENT_ID}&redirect_uri={encoded_uri}&response_type=code&scope=openid%20email%20profile%20User.Read&response_mode=query&state=microsoft"
    return {"configured": True, "url": url}

def _exchange_oauth_code(provider: str, code: str, redirect_uri: str) -> dict:
    if provider.lower() == "google":
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env"
            )
        token_url = "https://oauth2.googleapis.com/token"
        payload = urllib.parse.urlencode({
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri
        }).encode("utf-8")
        req = urllib.request.Request(token_url, data=payload, headers={"Content-Type": "application/x-www-form-urlencoded"})
        try:
            with urllib.request.urlopen(req) as resp:
                token_data = json.loads(resp.read().decode())
                access_token = token_data.get("access_token")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to exchange Google authorization code: {str(e)}")

        user_req = urllib.request.Request("https://www.googleapis.com/oauth2/v3/userinfo", headers={"Authorization": f"Bearer {access_token}"})
        try:
            with urllib.request.urlopen(user_req) as resp:
                profile = json.loads(resp.read().decode())
                email = profile.get("email", "").lower()
                name = profile.get("name") or email.split("@")[0]
                return {
                    "email": email,
                    "name": name,
                    "provider": "google",
                    "provider_id": profile.get("sub", "")
                }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch Google user profile: {str(e)}")

    elif provider.lower() == "microsoft":
        if not settings.MICROSOFT_CLIENT_ID or not settings.MICROSOFT_CLIENT_SECRET:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Microsoft OAuth is not configured. Please set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in backend/.env"
            )
        token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
        payload = urllib.parse.urlencode({
            "client_id": settings.MICROSOFT_CLIENT_ID,
            "client_secret": settings.MICROSOFT_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri
        }).encode("utf-8")
        req = urllib.request.Request(token_url, data=payload, headers={"Content-Type": "application/x-www-form-urlencoded"})
        try:
            with urllib.request.urlopen(req) as resp:
                token_data = json.loads(resp.read().decode())
                access_token = token_data.get("access_token")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to exchange Microsoft authorization code: {str(e)}")

        user_req = urllib.request.Request("https://graph.microsoft.com/v1.0/me", headers={"Authorization": f"Bearer {access_token}"})
        try:
            with urllib.request.urlopen(user_req) as resp:
                profile = json.loads(resp.read().decode())
                email = (profile.get("mail") or profile.get("userPrincipalName") or "").lower()
                name = profile.get("displayName") or email.split("@")[0]
                return {
                    "email": email,
                    "name": name,
                    "provider": "microsoft",
                    "provider_id": profile.get("id", "")
                }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch Microsoft user profile: {str(e)}")

    raise HTTPException(status_code=400, detail=f"Unsupported OAuth provider: {provider}")

@router.post("/oauth/callback")
def handle_oauth_callback(payload: OAuthCallbackPayload):
    db = get_database()
    r_uri = payload.redirect_uri or settings.OAUTH_FRONTEND_REDIRECT_URI

    # Exchange code for verified OpenID Connect profile
    profile = _exchange_oauth_code(payload.provider, payload.code, r_uri)
    email = profile["email"].lower()

    if not email:
        raise HTTPException(status_code=400, detail="OAuth provider did not supply a valid email address.")

    # Check if user already exists
    user = db.users.find_one({"email": email})

    if user:
        store = db.stores.find_one({"_id": ObjectId(user["store_id"])}) or {}
        token_data = {
            "sub": str(user["_id"]),
            "store_id": str(user["store_id"]),
            "email": user["email"],
            "role": user.get("role", "owner")
        }
        token = create_access_token(token_data)
        user_info = {
            "id": str(user["_id"]),
            "name": user.get("name", profile["name"]),
            "email": user.get("email", email),
            "phone": user.get("phone", ""),
            "role": user.get("role", "owner"),
            "store_id": str(user["store_id"]),
            "store_name": store.get("name", "Textile Retail Store")
        }
        return {
            "requires_store_setup": False,
            "access_token": token,
            "token_type": "bearer",
            "user": user_info
        }

    # User does not exist: required store setup step needed
    return {
        "requires_store_setup": True,
        "oauth_profile": profile
    }

@router.post("/oauth/complete-setup")
def complete_oauth_store_setup(payload: OAuthCompleteSetupPayload):
    db = get_database()
    email = payload.email.lower()

    # Check duplicate
    existing_user = db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email '{email}' already exists. Please sign in."
        )

    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Create Store record
    store_doc = {
        "name": payload.store_name,
        "address": payload.store_address or "",
        "city": payload.city or "Salem",
        "state": payload.state or "Tamil Nadu",
        "stateCode": "33",
        "pincode": payload.pincode or "600001",
        "gstin": payload.gstin or "",
        "created_at": now_iso
    }
    store_res = db.stores.insert_one(store_doc)
    store_id = str(store_res.inserted_id)

    # 2. Create User record with OAuth provider link
    random_pwd_hash = get_password_hash(secrets.token_urlsafe(32))
    user_doc = {
        "name": payload.name,
        "email": email,
        "phone": payload.phone,
        "hashed_password": random_pwd_hash,
        "role": "owner",
        "store_id": store_id,
        "oauth_provider": payload.provider,
        "oauth_provider_id": payload.provider_id,
        "created_at": now_iso
    }
    user_res = db.users.insert_one(user_doc)
    user_id = str(user_res.inserted_id)

    db.stores.update_one({"_id": store_res.inserted_id}, {"$set": {"owner_id": user_id}})

    # 3. Initialize default Store Settings
    settings_doc = {
        "store_id": store_id,
        "store": {
            "storeName": payload.store_name,
            "tagline": "Authentic Textile & Apparel Store",
            "address": payload.store_address or "",
            "city": payload.city or "Salem",
            "state": payload.state or "Tamil Nadu",
            "stateCode": "33",
            "pincode": payload.pincode or "600001",
            "phone": payload.phone,
            "email": email,
            "gstin": payload.gstin or "",
            "pan": ""
        },
        "billing": {
            "invoicePrefix": "TEX-2026-",
            "nextSequence": 1001,
            "defaultGSTRate": 5.0,
            "pricingMode": "inclusive",
            "defaultPaperSize": "80mm",
            "defaultPaymentMethod": "Cash",
            "enableRounding": True,
            "cashierName": payload.name,
            "enableAutoCoupons": True,
            "autoCouponThreshold": 2000.0,
            "autoCouponDiscount": 100.0,
            "autoCouponMinPurchase": 1000.0,
            "termsAndConditions": "1. Goods once sold can be exchanged within 7 days with original bill.\n2. Cut-length fabrics & pure silk sarees are non-returnable.\nThank you for shopping with us!"
        },
        "appearance": {"theme": "light"},
        "created_at": now_iso
    }
    db.settings.insert_one(settings_doc)

    token_data = {
        "sub": user_id,
        "store_id": store_id,
        "email": email,
        "role": "owner"
    }
    token = create_access_token(token_data)

    user_info = {
        "id": user_id,
        "name": payload.name,
        "email": email,
        "phone": payload.phone,
        "role": "owner",
        "store_id": store_id,
        "store_name": payload.store_name
    }

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_info
    }

# --- Forgot & Reset Password Flow ---

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    db = get_database()
    email = payload.email.lower()
    user = db.users.find_one({"email": email})

    if not user:
        # Prevent email enumeration: return standard positive message
        return {
            "success": True,
            "message": "If an account exists with this email, password reset instructions and a reset code have been generated."
        }

    reset_token = secrets.token_hex(16)
    db.password_resets.delete_many({"email": email})
    db.password_resets.insert_one({
        "email": email,
        "token": reset_token,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {
        "success": True,
        "message": f"Password reset code generated. Use code '{reset_token}' to reset your password.",
        "reset_token": reset_token
    }

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest):
    db = get_database()
    reset_record = db.password_resets.find_one({"token": payload.token.strip()})

    if not reset_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset code. Please request a new code."
        )

    email = reset_record["email"]
    new_hashed_pwd = get_password_hash(payload.new_password)

    db.users.update_one({"email": email}, {"$set": {"hashed_password": new_hashed_pwd}})
    db.password_resets.delete_many({"email": email})

    return {
        "success": True,
        "message": "Password reset successfully. You can now sign in with your new password."
    }
