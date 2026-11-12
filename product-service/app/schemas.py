from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    stock: int
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = []
    sizes: Optional[List[str]] = ["S", "M", "L", "XL"]
    colors: Optional[List[str]] = ["Black", "White", "Navy"]
    category_id: Optional[int] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    category: Optional[CategoryResponse] = None

    model_config = ConfigDict(from_attributes=True)