import { get, post } from "@/lib/api";
import { API_ROUTES } from "@/lib/constants";
import type { InviteLinkState, OrganizationDto } from "@/types/organization";

export function getMyOrg() {
  return get<OrganizationDto>(API_ROUTES.ORGS.ME);
}

export function getOrgInviteLink() {
  return get<InviteLinkState>(API_ROUTES.ORGS.INVITE_LINK);
}

export function rotateOrgInviteLink() {
  return post<InviteLinkState>(API_ROUTES.ORGS.INVITE_LINK_ROTATE, undefined);
}

export function getStoreInviteLink(storeId: string) {
  return get<InviteLinkState>(API_ROUTES.STORES.INVITE_LINK(storeId));
}

export function rotateStoreInviteLink(storeId: string) {
  return post<InviteLinkState>(
    API_ROUTES.STORES.INVITE_LINK_ROTATE(storeId),
    undefined,
  );
}
