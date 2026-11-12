from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.database import get_db
from app.permissions import Permission, user_has_permission
from app import models
from app.security import SECRET_KEY, ALGORITHM

# Point tokenUrl to the API Gateway login route for Swagger UI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:8000/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.UserModel).filter(models.UserModel.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_admin_user(current_user: models.UserModel = Depends(get_current_user)):
    user_role = getattr(current_user, "role", "customer")
    if user_role not in ["admin", "inventory_manager", "order_manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have administrative privileges."
        )
    return current_user

def require_permission(required_permission: Permission):
    def permission_checker(current_user: models.UserModel = Depends(get_current_user)):
        user_role = getattr(current_user, "role", "admin" if getattr(current_user, "is_admin", False) else "customer")
        
        if not user_has_permission(user_role, required_permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Missing required permission: '{required_permission.value}'"
            )
        return current_user
    return permission_checker