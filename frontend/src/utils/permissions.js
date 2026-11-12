// Centralized frontend permission registry mapping roles to permissions
export const ROLE_PERMISSIONS = {
  admin: ['*'], // Full wildcard access
  inventory_manager: ['inventory:read', 'inventory:create', 'inventory:update', 'category:manage'],
  order_manager: ['orders:read', 'orders:update_status', 'customers:read'],
  customer: []
};

export function hasPermission(userRole, requiredPermission) {
  if (!userRole) return false;
  if (userRole === 'admin') return true;
  
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(requiredPermission);
}