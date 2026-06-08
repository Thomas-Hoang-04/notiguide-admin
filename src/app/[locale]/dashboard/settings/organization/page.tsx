"use client";

import { getOrgJoinCode, rotateOrgJoinCode } from "@/features/organization/api";
import { JoinCodePanel } from "@/features/organization/join-code-panel";

export default function OrganizationSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <JoinCodePanel
        fetchCode={getOrgJoinCode}
        rotateCode={rotateOrgJoinCode}
      />
    </div>
  );
}
