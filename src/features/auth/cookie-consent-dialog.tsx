"use client";

import { ChevronDown, Cookie, Loader2, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ConsentStatus } from "@/hooks/use-cookie-consent";
import type { ConsentBrowserKind } from "@/lib/storage-access";
import { cn } from "@/lib/utils";

interface CookieConsentDialogProps {
  status: ConsentStatus;
  apiOrigin: string | null;
  browser: ConsentBrowserKind;
  onAllow: () => Promise<boolean>;
  onDecline: () => void;
  onAcknowledge: () => void;
}

export function CookieConsentDialog({
  status,
  apiOrigin,
  browser,
  onAllow,
  onDecline,
  onAcknowledge,
}: CookieConsentDialogProps) {
  const t = useTranslations("consent");
  const [submitting, setSubmitting] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  const open = status === "needed" || status === "manual";
  const isManual = status === "manual";

  async function handleAllow() {
    setSubmitting(true);
    try {
      await onAllow();
    } finally {
      setSubmitting(false);
    }
  }

  const stepKeys = manualStepKeys(browser);

  function handleOpenChange(nextOpen: boolean) {
    // Treat ESC / backdrop as a no-action dismissal — same as clicking
    // "Not now". The "I've enabled it" button has its own onClick handler
    // and won't trigger this fallback.
    if (!nextOpen) onDecline();
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-primary/10 text-primary">
            {isManual ? (
              <ShieldCheck aria-hidden="true" />
            ) : (
              <Cookie aria-hidden="true" />
            )}
          </AlertDialogMedia>
          <AlertDialogTitle>
            {isManual ? t("manualTitle") : t("autoTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isManual
              ? t("manualDescription", { origin: apiOrigin ?? "" })
              : t("autoDescription", { origin: apiOrigin ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isManual && stepKeys.length > 0 && (
          <ol className="m-0 list-decimal space-y-1.5 pl-5 text-sm text-foreground/85">
            {stepKeys.map((key) => (
              <li key={key} className="leading-relaxed">
                {t(key as Parameters<typeof t>[0], {
                  origin: apiOrigin ?? "",
                })}
              </li>
            ))}
          </ol>
        )}

        <Collapsible open={showLearnMore} onOpenChange={setShowLearnMore}>
          <CollapsibleTrigger
            render={
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              />
            }
          >
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-3 transition-transform",
                showLearnMore && "rotate-180",
              )}
            />
            {showLearnMore ? t("learnMoreHide") : t("learnMoreShow")}
          </CollapsibleTrigger>
          <CollapsibleContent className="rounded-md bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
            {t("learnMoreBody")}
          </CollapsibleContent>
        </Collapsible>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDecline} disabled={submitting}>
            {t("decline")}
          </AlertDialogCancel>
          {isManual ? (
            <AlertDialogAction
              onClick={onAcknowledge}
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
            >
              {t("manualAcknowledge")}
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              onClick={handleAllow}
              disabled={submitting}
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
            >
              {submitting && (
                <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />
              )}
              {t("allow")}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function manualStepKeys(browser: ConsentBrowserKind): string[] {
  switch (browser) {
    case "safari":
      return [
        "manualSteps.safari.0",
        "manualSteps.safari.1",
        "manualSteps.safari.2",
        "manualSteps.safari.3",
      ];
    case "firefox":
      return [
        "manualSteps.firefox.0",
        "manualSteps.firefox.1",
        "manualSteps.firefox.2",
      ];
    case "chromium":
      return [
        "manualSteps.chromium.0",
        "manualSteps.chromium.1",
        "manualSteps.chromium.2",
      ];
    default:
      return [
        "manualSteps.generic.0",
        "manualSteps.generic.1",
        "manualSteps.generic.2",
      ];
  }
}
