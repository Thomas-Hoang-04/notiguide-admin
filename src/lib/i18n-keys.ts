import { ROLES } from "@/lib/constants";
import type { AdminRole } from "@/types/admin";
import type { TicketStatus } from "@/types/queue";

export function getRoleTranslationKey(role: AdminRole) {
  return role === ROLES.SUPER_ADMIN ? "roleSuperAdmin" : "roleAdmin";
}

export function getVerificationTranslationKey(isVerified: boolean) {
  return isVerified ? "statusVerified" : "statusPending";
}

export function getStoreStatusTranslationKey(isActive: boolean) {
  return isActive ? "statusActive" : "statusInactive";
}

export function getTicketStatusTranslationKey(status: TicketStatus) {
  switch (status) {
    case "WAITING":
      return "statusWaiting";
    case "CALLED":
      return "statusCalled";
    case "SERVED":
      return "statusServed";
    case "CANCELLED":
      return "statusCancelled";
    case "SKIPPED":
      return "statusSkipped";
    case "REQUEUED":
      return "statusRequeued";
    default:
      return "statusUnknown";
  }
}
