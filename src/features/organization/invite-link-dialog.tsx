"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InviteLinkPanel } from "@/features/organization/invite-link-panel";
import type { InviteLinkState } from "@/types/organization";

interface InviteLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fetchLink: () => Promise<InviteLinkState>;
  generateLink: () => Promise<InviteLinkState>;
}

export function InviteLinkDialog({
  open,
  onOpenChange,
  fetchLink,
  generateLink,
}: InviteLinkDialogProps) {
  const tAdmins = useTranslations("admins");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="xs:max-w-lg">
        <DialogHeader>
          <DialogTitle>{tAdmins("inviteLinkTitle")}</DialogTitle>
          <DialogDescription>{tAdmins("inviteLinkDesc")}</DialogDescription>
        </DialogHeader>
        <InviteLinkPanel
          embedded
          fetchLink={fetchLink}
          generateLink={generateLink}
        />
      </DialogContent>
    </Dialog>
  );
}
