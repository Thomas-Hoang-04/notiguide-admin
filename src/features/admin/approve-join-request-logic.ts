import type { AdminRole } from "@/types/admin";

/**
 * A store must be chosen only when an org owner approves someone as a store-scoped
 * admin. Super admins are org-wide (no store); independent-store approvals assign the
 * approver's own store server-side.
 */
export function isStoreRequired(
  allowRoleChoice: boolean,
  role: AdminRole,
): boolean {
  return allowRoleChoice && role === "ROLE_ADMIN";
}

/** The approve button is enabled once any required store has been selected. */
export function isConfirmEnabled(
  allowRoleChoice: boolean,
  role: AdminRole,
  storeId: string,
): boolean {
  if (role === "ROLE_SUPER_ADMIN") return true;
  return !isStoreRequired(allowRoleChoice, role) || storeId.length > 0;
}
