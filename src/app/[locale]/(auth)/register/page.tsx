"use client";

import { Ticket } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { register } from "@/features/auth/api";
import { RegisterCreateOrgForm } from "@/features/auth/register-create-org-form";
import { RegisterCreateStoreForm } from "@/features/auth/register-create-store-form";
import { RegisterJoinForm } from "@/features/auth/register-join-form";
import { RegisterPathSelector } from "@/features/auth/register-path-selector";
import { RegisterPendingScreen } from "@/features/auth/register-pending-screen";
import { Link } from "@/i18n/navigation";
import type { RegisterMode, RegisterRequest } from "@/types/admin";

type View = "select" | RegisterMode | "active" | "pending";

export default function RegisterPage() {
  const locale = useLocale();
  const t = useTranslations("register");
  const tAuth = useTranslations("auth");
  const [view, setView] = useState<View>("select");
  const [submitting, setSubmitting] = useState(false);

  async function submit(request: RegisterRequest) {
    setSubmitting(true);
    try {
      const res = await register(request);
      setView(res.outcome === "PENDING" ? "pending" : "active");
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-gradient-auth relative flex min-h-screen items-center justify-center overflow-hidden p-3 s:p-4 l:p-6">
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2 s:top-4 s:right-4">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="login-orb login-orb-primary" />
      <div className="login-orb login-orb-secondary" />
      <Card className="glass-card relative z-10 w-full max-w-md pb-5 pt-6">
        <CardHeader className="gap-2 px-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Ticket aria-hidden="true" className="size-6" />
          </div>
          <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </CardHeader>
        <CardContent className="px-6 pb-4">
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
          {view === "JOIN" && (
            <RegisterJoinForm
              submitting={submitting}
              onBack={() => setView("select")}
              onSubmit={submit}
            />
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
        </CardContent>
      </Card>
    </div>
  );
}
