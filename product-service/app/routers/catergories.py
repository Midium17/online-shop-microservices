from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.database import get_db
from app.dependencies import require_permission
from app.permissions import Permission

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)

# 1. CREATE category (Protected: Requires category:manage permission)
@router.post("/", response_model=schemas.CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission(Permission.CATEGORY_MANAGE))
):
    existing = db.query(models.CategoryModel).filter(models.CategoryModel.name == category.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category already exists"
        )

    db_category = models.CategoryModel(name=category.name, description=category.description)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# 2. READ all categories (Public)
@router.get("/", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.CategoryModel).all()

# 3. READ a single category by ID (Public)
@router.get("/{category_id}", response_model=schemas.CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(models.CategoryModel).filter(models.CategoryModel.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found.")
    return category

# 4. UPDATE a category by ID (Protected: Requires category:manage permission)
@router.put("/{category_id}", response_model=schemas.CategoryResponse)
def update_category(
    category_id: int,
    category_update: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission(Permission.CATEGORY_MANAGE))
):
    db_category = db.query(models.CategoryModel).filter(models.CategoryModel.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found.")
    
    for key, value in category_update.dict().items():
        setattr(db_category, key, value)
        
    db.commit()
    db.refresh(db_category)
    return db_category

# 5. DELETE a category (Protected: Requires category:manage permission)
@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int, 
    db: Session = Depends(get_db),
    user: dict = Depends(require_permission(Permission.CATEGORY_MANAGE))
):
    category = db.query(models.CategoryModel).filter(models.CategoryModel.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found.")
    db.delete(category)
    db.commit()
    return None