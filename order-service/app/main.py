from fastapi import FastAPI, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
import models, schemas, database, security
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io
import httpx

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="MidOnline Order Service")

PRODUCT_SERVICE_URL = "http://localhost:8002"

import httpx

PRODUCT_SERVICE_URL = "http://localhost:8002"

@app.post("/orders/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(database.get_db)):
    if not order_data.items:
        raise HTTPException(status_code=400, detail="Cannot place an order with an empty cart.")

    total_amount = 0.0
    order_items_to_create = []

    # Use an HTTP client to communicate with the product service
    with httpx.Client() as client:
        for item in order_data.items:
            try:
                # Fetch product details from the product-service
                response = client.get(f"{PRODUCT_SERVICE_URL}/products/{item.product_id}")
                
                if response.status_code == 404:
                    raise HTTPException(status_code=404, detail=f"Product with ID {item.product_id} not found.")
                if response.status_code != 200:
                    raise HTTPException(status_code=502, detail="Failed to communicate with product service.")
                
                product = response.json()
                
                # Verify stock levels
                if product["stock"] < item.quantity:
                    raise HTTPException(status_code=400, detail=f"Insufficient stock for product: {product['title']}")

                # Optional: Send a patch/put request to deduct stock in the product-service
                # client.patch(f"{PRODUCT_SERVICE_URL}/products/{item.product_id}/deduct", json={"quantity": item.quantity})

                # Use verified price and title from the product service
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

    # Save the order to the local order-service database
    new_order = models.OrderModel(
        customer_email=order_data.customer_email,
        first_name=order_data.first_name,
        last_name=order_data.last_name,
        address=order_data.address,
        city=order_data.city,
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


@app.get("/orders/{order_id}/invoice")
def download_order_invoice(order_id: int, db: Session = Depends(database.get_db)):
    order = db.query(models.OrderModel).filter(models.OrderModel.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    p.setFont("Helvetica-Bold", 20)
    p.drawString(50, height - 50, "MidOnline Invoice")
    p.setFont("Helvetica", 10)
    p.drawString(50, height - 70, f"Order ID: #{order.id}")
    p.drawString(50, height - 85, f"Status: {order.status}")

    y = height - 120
    for item in order.items:
        p.drawString(50, y, f"{item.product_title} (x{item.quantity}) - ${item.price * item.quantity:.2f}")
        y -= 20

    p.drawString(50, y - 20, f"Total Amount: ${order.total_amount:.2f}")
    p.showPage()
    p.save()
    buffer.seek(0)

    return Response(
        buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_order_{order.id}.pdf"}
    )