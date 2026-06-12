"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { register, resolveInvite } from "@/features/auth/api";
import { RegisterCreateOrgForm } from "@/features/auth/register-create-org-form";
import { RegisterCreateStoreForm } from "@/features/auth/register-create-store-form";
import { RegisterJoinForm } from "@/features/auth/register-join-form";
import { RegisterJoinGuidance } from "@/features/auth/register-join-guidance";
import { RegisterPathSelector } from "@/features/auth/register-path-selector";
import { RegisterPendingScreen } from "@/features/auth/register-pending-screen";
import { Link } from "@/i18n/navigation";
import type { RegisterMode, RegisterRequest } from "@/types/admin";
import { ApiError } from "@/types/api";

type View = "select" | RegisterMode | "active" | "pending";

type InviteState =
  | { kind: "none" }
  | { kind: "loading"; token: string }
  | { kind: "resolved"; token: string; targetName: string }
  | { kind: "invalid" };

export function RegisterWizard() {
  const locale = useLocale();
  const t = useTranslations("register");
  const tAuth = useTranslations("auth");
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [view, setView] = useState<View>(inviteToken ? "JOIN" : "select");
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<InviteState>(
    inviteToken ? { kind: "loading", token: inviteToken } : { kind: "none" },
  );

  useEffect(() => {
    if (!inviteToken) return;
    let active = true;
    resolveInvite(inviteToken)
      .then((res) => {
        if (active)
          setInvite({
            kind: "resolved",
            token: inviteToken,
            targetName: res.name,
          });
      })
      .catch(() => {
        // 404 (unknown/expired/deleted target) and network failures share the
        // same fallback: the invalid warning above the guidance state (spec § 6).
        if (active) setInvite({ kind: "invalid" });
      });
    return () => {
      active = false;
    };
  }, [inviteToken]);

  async function submit(request: RegisterRequest) {
    setSubmitting(true);
    try {
      const res = await register(request);
      setView(res.status === "PENDING" ? "pending" : "active");
      return null;
    } catch (err) {
      // The token died between page load and submit: flip the invite state to
      // invalid so the warning + guidance replace the form (spec § 5.3).
      if (
        err instanceof ApiError &&
        err.code === 400 &&
        err.message.toLowerCase().includes("invite")
      ) {
        setInvite({ kind: "invalid" });
      }
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  const resolvingInvite = view === "JOIN" && invite.kind === "loading";

  return (
    <>
      {view === "select" && (
        <RegisterPathSelector onSelect={(m) => setView(m)} />
      )}
      {view === "CREATE_ORG" && (
        <RegisterCreateOrgForm
          submitting={submitting}
          onBack={() => setView("select")}
          onSubmit={submit}
        />
      )}
      {view === "CREATE_STORE" && (
        <RegisterCreateStoreForm
          submitting={submitting}
          onBack={() => setView("select")}
          onSubmit={submit}
        />
      )}
      {resolvingInvite && (
        <div className="flex justify-center py-8">
          <Loader2
            aria-hidden="true"
            className="size-5 animate-spin text-muted-foreground"
          />
        </div>
      )}
      {view === "JOIN" && !resolvingInvite && (
        <div className="space-y-4">
          {invite.kind === "invalid" && (
            <div className="flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/15 px-3.5 py-3 text-sm text-warning dark:border-warning/50 dark:bg-warning/20">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <span>{t("inviteInvalid")}</span>
            </div>
          )}
          {invite.kind === "resolved" ? (
            <RegisterJoinForm
              submitting={submitting}
              onBack={() => setView("select")}
              onSubmit={submit}
              invite={{ token: invite.token, targetName: invite.targetName }}
            />
          ) : (
            <RegisterJoinGuidance onBack={() => setView("select")} />
          )}
        </div>
      )}
      {view === "active" && <RegisterPendingScreen variant="active" />}
      {view === "pending" && <RegisterPendingScreen variant="pending" />}

      {(view === "select" ||
        view === "CREATE_ORG" ||
        view === "CREATE_STORE" ||
        view === "JOIN") && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            locale={locale}
            className="text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary/70"
          >
            {tAuth("haveAccountLink")}
          </Link>
        </p>
      )}
    </>
  );
}
