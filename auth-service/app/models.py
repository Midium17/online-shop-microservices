from sqlalchemy import Column, Integer, String
from database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    INVENTORY_MANAGER = "inventory_manager"
    ORDER_MANAGER = "order_manager"
    CUSTOMER = "customer"

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="customer")
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    country = Column(String, nullable=True)