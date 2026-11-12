from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.dependencies import get_current_user, get_current_admin_user
from typing import List
from app import models, schemas
from app.permissions import ROLE_PERMISSIONS, ALL_PERMISSIONS 
from app.database import get_db
from app.security import get_password_hash, verify_password, create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.UserModel).filter(models.UserModel.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    user_role = user.role if user.role else models.UserRole.CUSTOMER.value

    new_user = models.UserModel(
        email=user.email,
        hashed_password=hashed_password,
        role=user_role,
        first_name=getattr(user, "first_name", None),
        last_name=getattr(user, "last_name", None)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.UserModel).filter(models.UserModel.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Include role in the JWT claims payload so downstream services can check permissions locally
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.UserModel = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=schemas.UserResponse)
def update_my_profile(
    profile_update: schemas.UserProfileUpdate,
    current_user: models.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update logged-in customer's profile and default shipping address."""
    if profile_update.first_name is not None:
        current_user.first_name = profile_update.first_name
    if profile_update.last_name is not None:
        current_user.last_name = profile_update.last_name
    if profile_update.phone is not None:
        current_user.phone = profile_update.phone
    if profile_update.address is not None:
        current_user.address = profile_update.address
    if profile_update.city is not None:
        current_user.city = profile_update.city
    if profile_update.postal_code is not None:
        current_user.postal_code = profile_update.postal_code
    if profile_update.country is not None:
        current_user.country = profile_update.country

    db.commit()
    db.refresh(current_user)
    return current_user


# ==================== ADMIN & STAFF USER MANAGEMENT ====================

@router.get("/admin/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: models.UserModel = Depends(get_current_admin_user)):
    return db.query(models.UserModel).all()

@router.post("/admin/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def admin_create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.UserModel = Depends(get_current_admin_user)):
    if db.query(models.UserModel).filter(models.UserModel.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.UserModel(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        role=user.role if user.role else models.UserRole.CUSTOMER.value,
        first_name=getattr(user, "first_name", None),
        last_name=getattr(user, "last_name", None)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.patch("/admin/users/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(user_id: int, role_update: schemas.UserRoleUpdate, db: Session = Depends(get_db), current_user: models.UserModel = Depends(get_current_admin_user)):
    target_user = db.query(models.UserModel).filter(models.UserModel.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.role = role_update.role
    db.commit()
    db.refresh(target_user)
    return target_user

@router.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.UserModel = Depends(get_current_admin_user)):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    target_user = db.query(models.UserModel).filter(models.UserModel.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(target_user)
    db.commit()
    return None


# ==================== PERMISSIONS MANAGEMENT ====================

@router.get("/admin/permissions")
def get_role_permissions(current_user: models.UserModel = Depends(get_current_admin_user)):
    return {
        "permissions": list(ALL_PERMISSIONS),
        "role_permissions": ROLE_PERMISSIONS
    }

@router.put("/admin/permissions/{role}")
def update_role_permissions(
    role: str,
    permissions_payload: schemas.RolePermissionsUpdate,
    current_user: models.UserModel = Depends(get_current_admin_user)
):
    if role not in ROLE_PERMISSIONS:
        raise HTTPException(status_code=404, detail="Role not found")

    ROLE_PERMISSIONS[role] = set(permissions_payload.permissions)
    return {"message": f"Permissions updated for role: {role}", "permissions": list(ROLE_PERMISSIONS[role])}


# ==================== CUSTOMER DIRECTORY ====================

@router.get("/admin/customers", response_model=List[schemas.UserResponse])
def get_all_customers(db: Session = Depends(get_db), current_user: models.UserModel = Depends(get_current_admin_user)):
    """Fetch all registered customers from the isolated auth database."""
    customers = db.query(models.UserModel).filter(
        (models.UserModel.role == "customer") | (models.UserModel.role == None)
    ).all()
    return customers

@router.put("/admin/customers/{customer_id}", response_model=schemas.UserResponse)
def update_customer(
    customer_id: int,
    user_update: dict,
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(get_current_admin_user)
):
    customer = db.query(models.UserModel).filter(models.UserModel.id == customer_id, models.UserModel.role == "customer").first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    for key, value in user_update.items():
        if hasattr(customer, key) and value is not None:
            setattr(customer, key, value)
        
    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/admin/customers/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.UserModel = Depends(get_current_admin_user)
):
    customer = db.query(models.UserModel).filter(models.UserModel.id == customer_id, models.UserModel.role == "customer").first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    db.delete(customer)
    db.commit()
    return {"message": f"Customer #{customer_id} deleted successfully"}