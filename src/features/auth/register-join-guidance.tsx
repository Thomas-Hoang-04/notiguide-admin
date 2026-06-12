"use client";

import { Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface RegisterJoinGuidanceProps {
  onBack: () => void;
}

/** "Joining needs an invitation link" info state — the JOIN view without a
 * resolved token never renders credential fields (spec § 3). */
export function RegisterJoinGuidance({ onBack }: RegisterJoinGuidanceProps) {
  const t = useTranslations("register");
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3">
        <Link2
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-primary"
        />
        <div className="space-y-1">
          <p className="text-sm font-semibold">{t("inviteRequiredTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("inviteRequiredDesc")}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onBack}
      >
        {t("back")}
      </Button>
    </div>
  );
}
