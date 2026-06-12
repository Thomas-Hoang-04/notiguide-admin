"use client";

import { AlertTriangle, Copy, Loader2, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { ApiError } from "@/types/api";
import type { InviteLinkState } from "@/types/organization";

interface InviteLinkPanelProps {
  fetchLink: () => Promise<InviteLinkState>;
  generateLink: () => Promise<InviteLinkState>;
}

// Time display is language-agnostic across the app: fixed locale, not next-intl
// (same pattern as waiting-list.tsx / serving-display.tsx).
const expiryFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const usedAtFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export function InviteLinkPanel({
  fetchLink,
  generateLink,
}: InviteLinkPanelProps) {
  const tAdmins = useTranslations("admins");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const [origin, setOrigin] = useState("");
  const [link, setLink] = useState<InviteLinkState | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    // window is unavailable during prerender; resolve the origin after mount.
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    fetchLink()
      .then(setLink)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchLink]);

  const inviteUrl =
    link?.token && origin
      ? `${origin}/${locale}/register?invite=${link.token}`
      : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success(tAdmins("inviteLinkCopied"));
    } catch {
      toast.error(tAdmins("copyFailed"));
    }
  }

  async function generate() {
    setWorking(true);
    try {
      setLink(await generateLink());
    } catch (err) {
      // Surface lock conflicts (409) and other failures so the owner knows to
      // retry — a silent close would leave a possibly-revoked link on screen.
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setWorking(false);
      setConfirmOpen(false);
    }
  }

  const currentLinkId = link?.token ? link.token.slice(-4) : null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">{tAdmins("inviteLinkTitle")}</h2>
      <p className="mt-1 mb-3 text-sm text-muted-foreground">
        {tAdmins("inviteLinkDesc")}
      </p>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2
            aria-hidden="true"
            className="size-4 animate-spin text-muted-foreground"
          />
        </div>
      ) : link?.token && link.expiresAt ? (
        <>
          <div className="flex gap-2">
            <Input readOnly value={inviteUrl} className="font-mono" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copy}
              aria-label={tAdmins("inviteLinkCopy")}
            >
              <Copy className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setConfirmOpen(true)}
              aria-label={tAdmins("inviteLinkRegenerate")}
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {tAdmins("inviteLinkValidUntil", {
              date: expiryFormatter.format(new Date(link.expiresAt)),
            })}
          </p>
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/15 px-3.5 py-3 text-sm text-warning dark:border-warning/50 dark:bg-warning/20">
            <AlertTriangle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            <span>{tAdmins("inviteLinkCaution")}</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            {tAdmins("inviteLinkEmpty")}
          </p>
          <Button
            type="button"
            disabled={working}
            onClick={() => void generate()}
            className="bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            {working && (
              <Loader2
                aria-hidden="true"
                className="mr-2 size-4 animate-spin"
              />
            )}
            {tAdmins("inviteLinkGenerate")}
          </Button>
        </div>
      )}

      {!loading && link && link.recentUses.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <h3 className="text-sm font-semibold">
            {tAdmins("inviteLinkUsageTitle")}
          </h3>
          <p className="mt-0.5 mb-2 text-xs text-muted-foreground">
            {tAdmins("inviteLinkUsageDesc")}
          </p>
          <div className="space-y-1.5">
            {link.recentUses.map((use) => {
              const isCurrent =
                currentLinkId !== null && use.linkId === currentLinkId;
              return (
                <div
                  key={`${use.usedAt}-${use.username}-${use.linkId}`}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="truncate font-medium">{use.username}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {usedAtFormatter.format(new Date(use.usedAt))}
                    </span>
                    <Badge
                      variant={isCurrent ? "default" : "outline"}
                      className="font-mono"
                      title={
                        isCurrent
                          ? tAdmins("inviteLinkUsageCurrent")
                          : undefined
                      }
                    >
                      {use.linkId}
                    </Badge>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(next) => !working && setConfirmOpen(next)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tAdmins("inviteLinkRegenerate")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tAdmins("inviteLinkRegenerateConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={working}
              onClick={(e) => {
                e.preventDefault();
                void generate();
              }}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              {working && <Loader2 className="mr-2 size-4 animate-spin" />}
              {tAdmins("inviteLinkRegenerate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
