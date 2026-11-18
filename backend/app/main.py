
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

from app.database.connection import (
    initialize_memory_store,
    close_memory_store
)

from app.routes import (
    auth,
    products,
    customers,
    coupons,
    festival_offers,
    invoices,
    dashboard,
    reports,
    settings as settings_routes
)


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger("texbill_api")


@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info("Initializing Textile POS Backend...")

    initialize_memory_store()

    yield

    logger.info("Shutting down Textile POS Backend...")

    close_memory_store()


app = FastAPI(
    title="Textile Store POS Billing & Retail ERP API",
    description=(
        "FastAPI backend for textile store POS, GST tax invoicing, "
        "and promotional festival coupons."
    ),
    version="1.0.0",
    lifespan=lifespan
)


# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API Routers
for prefix in ["/api/v1", "/api"]:

    app.include_router(auth.router, prefix=prefix)
    app.include_router(products.router, prefix=prefix)
    app.include_router(customers.router, prefix=prefix)
    app.include_router(coupons.router, prefix=prefix)
    app.include_router(festival_offers.router, prefix=prefix)
    app.include_router(invoices.router, prefix=prefix)
    app.include_router(dashboard.router, prefix=prefix)
    app.include_router(reports.router, prefix=prefix)
    app.include_router(settings_routes.router, prefix=prefix)


@app.get("/api/health")
def health_check():

    return {
        "status": "healthy",
        "service": "Textile POS Backend",
        "version": "1.0.0"
    }


@app.get("/")
def root():

    return {
        "status": "running",
        "message": "Textile POS Billing API"
    }
