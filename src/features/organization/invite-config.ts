import {
  getOrgInviteLink,
  getStoreInviteLink,
  rotateOrgInviteLink,
  rotateStoreInviteLink,
} from "@/features/organization/api";
import type { InviteLinkState } from "@/types/organization";

export interface InviteConfig {
  fetchLink: () => Promise<InviteLinkState>;
  generateLink: () => Promise<InviteLinkState>;
}

// Returns the fetch/generate pair for the applicable invite link, or null when none applies.
export function resolveInviteConfig(
  isSuperAdmin: boolean,
  adminStoreId: string | null,
  storeOrgId: string | null | undefined,
): InviteConfig | null {
  if (isSuperAdmin) {
    return { fetchLink: getOrgInviteLink, generateLink: rotateOrgInviteLink };
  }
  if (adminStoreId && storeOrgId === null) {
    return {
      fetchLink: () => getStoreInviteLink(adminStoreId),
      generateLink: () => rotateStoreInviteLink(adminStoreId),
    };
  }
  return null;
}
