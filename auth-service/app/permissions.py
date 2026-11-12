from enum import Enum
from typing import Set, Union

class Permission(str, Enum):
    # Inventory Permissions
    INVENTORY_READ = "inventory:read"
    INVENTORY_CREATE = "inventory:create"
    INVENTORY_UPDATE = "inventory:update"
    INVENTORY_DELETE = "inventory:delete"

    # Category Permissions
    CATEGORY_MANAGE = "category:manage"

    # Order Permissions
    ORDERS_READ = "orders:read"
    ORDERS_UPDATE_STATUS = "orders:update_status"
    ORDERS_DELETE = "orders:delete"

    # Customer & Analytics Permissions
    CUSTOMERS_READ = "customers:read"
    ANALYTICS_READ = "analytics:read"

ALL_PERMISSIONS: Set[str] = {p.value for p in Permission}

ROLE_PERMISSIONS: dict[str, Set[str]] = {
    "admin": ALL_PERMISSIONS,
    "inventory_manager": {
        Permission.INVENTORY_READ.value,
        Permission.INVENTORY_CREATE.value,
        Permission.INVENTORY_UPDATE.value,
        Permission.CATEGORY_MANAGE.value,
    },
    "order_manager": {
        Permission.ORDERS_READ.value,
        Permission.ORDERS_UPDATE_STATUS.value,
        Permission.CUSTOMERS_READ.value,
    },
    "customer": set()
}

def user_has_permission(user_role: str, required_permission: Union[Permission, str]) -> bool:
    if user_role == "admin":
        return True
    perm_str = required_permission.value if isinstance(required_permission, Permission) else required_permission
    return perm_str in ROLE_PERMISSIONS.get(user_role, set())