"use client";

import { CheckCircle2, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

interface RegisterPendingScreenProps {
  variant: "active" | "pending";
}

export function RegisterPendingScreen({ variant }: RegisterPendingScreenProps) {
  const t = useTranslations("register");
  const locale = useLocale();
  const isPending = variant === "pending";

  return (
    <div className="space-y-5 text-center">
      {isPending ? (
        <div className="rounded-lg border border-warning/40 bg-warning/15 p-4 text-sm font-medium text-warning dark:border-warning/50 dark:bg-warning/20">
          <Clock aria-hidden="true" className="mx-auto mb-2 size-6" />
          <p className="text-base font-semibold">{t("pendingTitle")}</p>
          <p className="mt-1 font-normal">{t("pendingDesc")}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm font-medium text-success dark:border-success/50 dark:bg-success/15">
          <CheckCircle2 aria-hidden="true" className="mx-auto mb-2 size-6" />
          <p className="text-base font-semibold">{t("createdActiveTitle")}</p>
          <p className="mt-1 font-normal">{t("createdActiveDesc")}</p>
        </div>
      )}
      <Button
        render={<Link href="/login" locale={locale} />}
        className="w-full bg-primary text-primary-foreground hover:bg-primary-hover"
      >
        {t("goToLogin")}
      </Button>
    </div>
  );
}
