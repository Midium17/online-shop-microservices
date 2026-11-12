from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Response
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import models, schemas, database
import os, shutil, csv, io

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="MidOnline Product Service")

os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/products/", response_model=list[schemas.ProductResponse])
def get_products(db: Session = Depends(database.get_db)):
    return db.query(models.ProductModel).all()

@app.post("/products/", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(database.get_db)):
    db_product = models.ProductModel(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@app.get("/categories/", response_model=list[schemas.CategoryResponse])
def get_categories(db: Session = Depends(database.get_db)):
    return db.query(models.CategoryModel).all()