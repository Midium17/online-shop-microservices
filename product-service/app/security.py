from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

# MUST match the SECRET_KEY used in the auth-service
SECRET_KEY = "YOUR_SUPER_SECRET_KEY_CHANGE_IN_PRODUCTION"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:8000/auth/login")

def get_current_user_email(token: str = Depends(oauth2_scheme)) -> str:
    """Decode the JWT locally and extract the user email (subject)."""
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
        return email
    except JWTError:
        raise credentials_exception