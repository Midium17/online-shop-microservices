from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io
import httpx
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies import get_current_user_claims, require_permission
from app.permissions import Permission
from app import models, schemas
from app.database import get_db

router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)

PRODUCT_SERVICE_URL = "http://localhost:8002"

@router.post("/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: schemas.OrderCreate, 
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user_claims) # Optional or required depending on checkout policy
):
    if not order_data.items:
        raise HTTPException(status_code=400, detail="Cannot place an order with an empty cart.")

    total_amount = 0.0
    order_items_to_create = []

    # Forward token if user is authenticated so inter-service calls remain secure
    auth_header = request.headers.get("Authorization")
    headers = {"Authorization": auth_header} if auth_header else {}

    with httpx.Client() as client:
        for item in order_data.items:
            try:
                # Query the product-service via HTTPX
                response = client.get(f"{PRODUCT_SERVICE_URL}/products/{item.product_id}", headers=headers)
                
                if response.status_code == 404:
                    raise HTTPException(status_code=404, detail=f"Product with ID {item.product_id} not found.")
                if response.status_code != 200:
                    raise HTTPException(status_code=502, detail="Failed to communicate with product service.")
                
                product = response.json()

                if product["stock"] < item.quantity:
                    raise HTTPException(status_code=400, detail=f"Insufficient stock for product: {product['title']}")

                # Optional: Deduct stock by calling product-service endpoint
                # client.patch(f"{PRODUCT_SERVICE_URL}/products/{item.product_id}/deduct", json={"quantity": item.quantity}, headers=headers)

                verified_price = float(product["price"])
                verified_title = product["title"]
                total_amount += verified_price * item.quantity

                order_items_to_create.append(
                    models.OrderItemModel(
                        product_id=product["id"],
                        product_title=verified_title,
                        quantity=item.quantity,
                        price=verified_price
                    )
                )
            except httpx.RequestError as exc:
                raise HTTPException(status_code=503, detail=f"Product service is unreachable: {str(exc)}")

    # Save order to local order-service database
    user_email = current_user["email"] if current_user else order_data.customer_email

    new_order = models.OrderModel(
        user_id=None, # Stored as isolated order data
        customer_email=user_email,
        first_name=order_data.first_name,
        last_name=order_data.last_name,
        phone=order_data.phone,
        address=order_data.address,
        city=order_data.city,
        postal_code=order_data.postal_code,
        country=order_data.country,
        total_amount=total_amount + 10.00, # Shipping fee
        status="Pending"
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    for order_item in order_items_to_create:
        order_item.order_id = new_order.id
        db.add(order_item)

    db.commit()
    db.refresh(new_order)
    return new_order

@router.get("/", response_model=List[schemas.OrderResponse])
def get_orders(
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission(Permission.ORDERS_READ))
):
    """Requires 'orders:read' permission (Admin & Order Manager)"""
    return db.query(models.OrderModel).all()

@router.patch("/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    order_id: int, 
    status_update: schemas.OrderStatusUpdate, 
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission(Permission.ORDERS_UPDATE_STATUS))
):
    """Requires 'orders:update_status' permission (Admin & Order Manager)"""
    order = db.query(models.OrderModel).filter(models.OrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    
    order.status = status_update.status
    db.commit()
    db.refresh(order)
    return order

@router.get("/my-orders", response_model=List[schemas.OrderResponse])
def get_my_orders(
    current_user: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    """Retrieve all orders placed by the currently logged-in user."""
    try:
        orders = db.query(models.OrderModel).filter(
            models.OrderModel.customer_email == current_user["email"]
        ).order_by(models.OrderModel.id.desc()).all()
        return orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.patch("/{order_id}/cancel", response_model=schemas.OrderResponse)
def cancel_my_order(
    order_id: int,
    current_user: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    """Allow a logged-in customer to cancel their own pending order."""
    order = db.query(models.OrderModel).filter(
        models.OrderModel.id == order_id,
        models.OrderModel.customer_email == current_user["email"]
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    
    if order.status.lower() != "pending":
        raise HTTPException(status_code=400, detail="Only pending orders can be cancelled.")
    
    order.status = "Cancelled"
    db.commit()
    db.refresh(order)
    return order

@router.get("/{order_id}/invoice")
def download_order_invoice(
    order_id: int,
    current_user: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    """Generate and stream a safe PDF invoice for a specific customer order."""
    order = db.query(models.OrderModel).filter(
        models.OrderModel.id == order_id,
        models.OrderModel.customer_email == current_user["email"]
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    try:
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # Header
        p.setFont("Helvetica-Bold", 20)
        p.drawString(50, height - 50, "MidOnline Invoice")
        
        p.setFont("Helvetica", 10)
        p.drawString(50, height - 70, f"Order ID: #{order.id}")
        
        date_str = order.created_at.strftime('%Y-%m-%d %H:%M') if getattr(order, 'created_at', None) else 'N/A'
        p.drawString(50, height - 85, f"Date: {date_str}")
        p.drawString(50, height - 100, f"Status: {order.status or 'Pending'}")

        # Shipping Details
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, height - 135, "Shipping Address:")
        p.setFont("Helvetica", 10)
        p.drawString(50, height - 150, f"{order.first_name or ''} {order.last_name or ''}")
        p.drawString(50, height - 165, f"{order.address or 'N/A'}, {order.city or ''}")
        p.drawString(50, height - 180, f"{order.country or ''} (Phone: {order.phone or 'N/A'})")

        # Table Header
        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, height - 220, "Product")
        p.drawString(300, height - 220, "Qty")
        p.drawString(380, height - 220, "Price")
        p.drawString(460, height - 220, "Total")
        p.line(50, height - 225, 550, height - 225)

        # Table Items
        y = height - 245
        p.setFont("Helvetica", 10)
        for item in order.items:
            title = getattr(item, 'product_title', None) or f"Product #{item.product_id}"
            price = float(getattr(item, 'price', 0.0) or 0.0)
            qty = int(getattr(item, 'quantity', 1) or 1)
            
            p.drawString(50, y, str(title)[:40])
            p.drawString(300, y, str(qty))
            p.drawString(380, y, f"${price:.2f}")
            p.drawString(460, y, f"${(price * qty):.2f}")
            y -= 20
            
            if y < 50:
                p.showPage()
                y = height - 50

        # Total Amount
        p.line(50, y - 5, 550, y - 5)
        p.setFont("Helvetica-Bold", 12)
        total_amt = float(getattr(order, 'total_amount', 0.0) or 0.0)
        p.drawString(380, y - 25, "Total Amount:")
        p.drawString(460, y - 25, f"${total_amt:.2f}")

        p.showPage()
        p.save()
        buffer.seek(0)

        return Response(
            buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=invoice_order_{order.id}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Generation Error: {str(e)}")