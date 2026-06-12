"use client";

import {
  getOrgInviteLink,
  rotateOrgInviteLink,
} from "@/features/organization/api";
import { InviteLinkPanel } from "@/features/organization/invite-link-panel";

export default function OrganizationSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <InviteLinkPanel
        fetchLink={getOrgInviteLink}
        generateLink={rotateOrgInviteLink}
      />
    </div>
  );
}
