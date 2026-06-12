export interface OrganizationDto {
  id: string;
  name: string;
  createdAt: string | null;
}

export interface InviteLinkUse {
  username: string;
  usedAt: string;
  linkId: string;
}

export interface InviteLinkState {
  token: string | null;
  expiresAt: string | null;
  recentUses: InviteLinkUse[];
}
