from datetime import datetime, timezone
from typing import Dict, Any, List
from fastapi import HTTPException
from bson import ObjectId
from app.services.festival_service import get_active_festival_offer
from app.services.coupon_service import validate_and_apply_coupon, generate_automatic_post_sale_coupon

def round2(val: float) -> float:
    return round(float(val) + 1e-9, 2)

def calculate_invoice_totals(
    items: List[Dict[str, Any]],
    bill_discount: Dict[str, Any],
    is_tax_inclusive: bool = True
) -> Dict[str, Any]:
    """
    Computes line item math, item discounts, bill discounts, and tax splits.
    """
    total_qty = 0
    gross_subtotal = 0.0
    total_item_disc = 0.0

    processed_items = []

    for itm in items:
        qty = int(itm.get("quantity", 1))
        unit_price = float(itm.get("unitPrice", 0.0))
        gst_rate = float(itm.get("gstRate", 5.0))
        gross = round2(qty * unit_price)

        disc_type = itm.get("discountType", "fixed")
        disc_val = float(itm.get("discountValue", 0.0))

        item_disc = 0.0
        if disc_type == "percent":
            percent = min(100.0, max(0.0, disc_val))
            item_disc = round2((gross * percent) / 100.0)
        else:
            item_disc = round2(min(gross, disc_val))

        effective_line = max(0.0, gross - item_disc)

        total_qty += qty
        gross_subtotal += gross
        total_item_disc += item_disc

        processed_items.append({
            **itm,
            "quantity": qty,
            "unitPrice": unit_price,
            "grossAmount": gross,
            "discountType": disc_type,
            "discountValue": disc_val,
            "itemDiscountAmount": item_disc,
            "effectiveLine": effective_line,
            "gstRate": gst_rate
        })

    subtotal_after_item_disc = max(0.0, gross_subtotal - total_item_disc)

    # Bill discount
    bill_disc_amount = 0.0
    b_type = (bill_discount or {}).get("type", "fixed")
    b_val = float((bill_discount or {}).get("value", 0.0))
    if b_type == "percent":
        bill_disc_amount = round2((subtotal_after_item_disc * min(100.0, max(0.0, b_val))) / 100.0)
    else:
        bill_disc_amount = round2(min(subtotal_after_item_disc, b_val))

    return {
        "totalItems": len(items),
        "totalQuantity": total_qty,
        "grossSubtotal": round2(gross_subtotal),
        "totalItemDiscount": round2(total_item_disc),
        "billDiscountAmount": bill_disc_amount,
        "subtotalAfterItemDisc": subtotal_after_item_disc,
        "processedItems": processed_items
    }

def process_checkout_and_save(
    db,
    store_id: str,
    invoice_payload: Dict[str, Any],
    cashier_name: str = "Cashier"
) -> Dict[str, Any]:
    """
    Atomic checkout execution: calculates taxes, applies discounts, records invoice,
    updates customer, advances sequence number, creates auto coupon.
    """
    settings_doc = db.settings.find_one({"store_id": store_id}) or {}
    billing_cfg = settings_doc.get("billing", {})
    store_cfg = settings_doc.get("store", {})

    is_tax_inclusive = billing_cfg.get("pricingMode", "inclusive") == "inclusive"

    items_input = invoice_payload.get("items", [])
    if not items_input:
        raise HTTPException(status_code=400, detail="Cannot checkout an empty invoice.")

    # 1. Base calculations
    base_calc = calculate_invoice_totals(
        items_input,
        invoice_payload.get("billDiscount", {}),
        is_tax_inclusive
    )

    subtotal = base_calc["subtotalAfterItemDisc"]
    bill_disc = base_calc["billDiscountAmount"]
    curr_balance = max(0.0, subtotal - bill_disc)

    # 2. Check & Apply Festival Offer
    item_categories = [itm.get("category", "") for itm in items_input if itm.get("category")]
    festival_offer = get_active_festival_offer(db, store_id, curr_balance, item_categories)
    festival_disc_amount = 0.0
    if festival_offer:
        festival_disc_amount = min(curr_balance, festival_offer["discount_amount"])
        curr_balance = max(0.0, curr_balance - festival_disc_amount)

    # 3. Check & Apply Coupon
    coupon_code = invoice_payload.get("coupon_code")
    applied_coupon_data = None
    coupon_disc_amount = 0.0
    customer_id = (invoice_payload.get("customer") or {}).get("id")

    if coupon_code and coupon_code.strip():
        val_res = validate_and_apply_coupon(db, store_id, coupon_code, curr_balance, customer_id)
        if not val_res["valid"]:
            raise HTTPException(status_code=400, detail=val_res["error"])
        coupon_disc_amount = min(curr_balance, val_res["discount_amount"])
        curr_balance = max(0.0, curr_balance - coupon_disc_amount)
        applied_coupon_data = val_res

    # 4. Proportional distribution for GST tax base
    total_effective_after_discounts = curr_balance
    total_subtotal = base_calc["subtotalAfterItemDisc"]
    ratio = (total_effective_after_discounts / total_subtotal) if total_subtotal > 0 else 1.0

    total_taxable = 0.0
    total_cgst = 0.0
    total_sgst = 0.0
    total_tax = 0.0
    final_items = []

    for itm in base_calc["processedItems"]:
        line_effective = itm["effectiveLine"] * ratio
        rate = itm["gstRate"]

        item_taxable = 0.0
        item_tax = 0.0
        if is_tax_inclusive:
            item_taxable = round2(line_effective / (1.0 + rate / 100.0))
            item_tax = round2(line_effective - item_taxable)
            line_final = round2(line_effective)
        else:
            item_taxable = round2(line_effective)
            item_tax = round2((item_taxable * rate) / 100.0)
            line_final = round2(item_taxable + item_tax)

        cgst_amt = round2(item_tax / 2.0)
        sgst_amt = round2(item_tax - cgst_amt)

        total_taxable += item_taxable
        total_cgst += cgst_amt
        total_sgst += sgst_amt
        total_tax += item_tax

        final_items.append({
            **itm,
            "taxableAmount": item_taxable,
            "taxAmount": item_tax,
            "cgstRate": rate / 2.0,
            "cgstAmount": cgst_amt,
            "sgstRate": rate / 2.0,
            "sgstAmount": sgst_amt,
            "lineTotal": line_final
        })

    total_taxable = round2(total_taxable)
    total_cgst = round2(total_cgst)
    total_sgst = round2(total_sgst)
    total_tax = round2(total_tax)

    if is_tax_inclusive:
        raw_grand_total = total_effective_after_discounts
    else:
        raw_grand_total = round2(total_taxable + total_tax)

    net_payable = round(raw_grand_total)
    round_off = round2(net_payable - raw_grand_total)
    total_all_discounts = round2(
        base_calc["totalItemDiscount"] + bill_disc + festival_disc_amount + coupon_disc_amount
    )

    # 5. Payment Validation
    payment_info = invoice_payload.get("payment", {})
    method = payment_info.get("method", "Cash")
    amt_received = float(payment_info.get("amountReceived", net_payable))

    change_returned = 0.0
    if method == "Cash":
        if amt_received < net_payable:
            raise HTTPException(
                status_code=400,
                detail=f"Cash tendered (₹{amt_received:.2f}) cannot be less than payable (₹{net_payable:.2f})."
            )
        change_returned = round2(amt_received - net_payable)
    elif method == "Split":
        split = payment_info.get("splitDetails") or {}
        split_sum = round2(float(split.get("cash", 0)) + float(split.get("upi", 0)) + float(split.get("card", 0)))
        if abs(split_sum - net_payable) > 0.05:
            raise HTTPException(
                status_code=400,
                detail=f"Split payment sum (₹{split_sum:.2f}) does not match net payable (₹{net_payable:.2f})."
            )

    # 6. Generate sequential invoice number
    prefix = billing_cfg.get("invoicePrefix", "TEX-2026-")
    seq = int(billing_cfg.get("nextSequence", 1001))
    invoice_number = f"{prefix}{seq:04d}"

    # Advance sequence in settings
    db.settings.update_one(
        {"store_id": store_id},
        {"$set": {"billing.nextSequence": seq + 1}}
    )

    # 7. Record coupon usage if applied
    if applied_coupon_data:
        db.coupons.update_one(
            {"_id": ObjectId(applied_coupon_data["coupon_id"])},
            {"$inc": {"times_used": 1}}
        )
        db.coupon_redemptions.insert_one({
            "store_id": store_id,
            "coupon_id": applied_coupon_data["coupon_id"],
            "code": applied_coupon_data["code"],
            "invoice_number": invoice_number,
            "customer_id": customer_id,
            "discount_amount": coupon_disc_amount,
            "redeemed_at": datetime.now(timezone.utc).isoformat()
        })

    # 8. Check auto-coupon generation
    auto_coupon = generate_automatic_post_sale_coupon(
        db, store_id, invoice_number, net_payable, customer_id, settings_doc
    )

    # 9. Customer details & stats update
    cust_data = invoice_payload.get("customer") or {
        "id": "walk-in",
        "name": "Walk-in Customer",
        "phone": "9840000000",
        "city": "Local",
        "state": "Tamil Nadu",
        "gstin": ""
    }

    if cust_data.get("id") and cust_data["id"] != "walk-in":
        try:
            db.customers.update_one(
                {"_id": ObjectId(cust_data["id"])},
                {
                    "$inc": {"totalPurchases": net_payable, "totalBills": 1},
                    "$set": {"lastPurchaseDate": datetime.now(timezone.utc).isoformat()}
                }
            )
        except Exception:
            pass

    # 10. Assemble complete document
    now_iso = datetime.now(timezone.utc).isoformat()

    invoice_doc = {
        "store_id": store_id,
        "invoiceNumber": invoice_number,
        "date": now_iso,
        "customer": cust_data,
        "items": final_items,
        "summary": {
            "totalItems": base_calc["totalItems"],
            "totalQuantity": base_calc["totalQuantity"],
            "grossSubtotal": base_calc["grossSubtotal"],
            "totalItemDiscount": base_calc["totalItemDiscount"],
            "billDiscountAmount": bill_disc,
            "couponDiscountAmount": coupon_disc_amount,
            "festivalDiscountAmount": festival_disc_amount,
            "totalDiscount": total_all_discounts,
            "taxableSubtotal": total_taxable,
            "totalTax": total_tax,
            "totalCGST": total_cgst,
            "totalSGST": total_sgst,
            "grandTotal": raw_grand_total,
            "roundOff": round_off,
            "netPayable": net_payable
        },
        "payment": {
            "method": method,
            "reference": payment_info.get("reference", ""),
            "amountReceived": amt_received,
            "changeReturned": change_returned,
            "splitDetails": payment_info.get("splitDetails") if method == "Split" else None
        },
        "applied_coupon": applied_coupon_data,
        "applied_festival": festival_offer,
        "generated_coupon": auto_coupon,
        "cashier": cashier_name,
        "notes": invoice_payload.get("notes", ""),
        "status": "Completed",
        "created_at": now_iso
    }

    res = db.invoices.insert_one(invoice_doc)
    invoice_doc["id"] = str(res.inserted_id)
    return invoice_doc
