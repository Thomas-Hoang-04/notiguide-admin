"use client";

import { Eye, EyeOff, Loader2, Ticket } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineError } from "@/components/ui/inline-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { abortLogin, login, verifySession } from "@/features/auth/api";
import { CookieConsentDialog } from "@/features/auth/cookie-consent-dialog";
import { useCookieConsent } from "@/hooks/use-cookie-consent";
import { useRouter } from "@/i18n/navigation";
import { translateCommonApiError } from "@/lib/api-error";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/types/api";

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const tConsent = useTranslations("consent");
  const { isAuthenticated, login: setAuth } = useAuthStore();
  const consent = useCookieConsent();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unverifiedBanner, setUnverifiedBanner] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard", { locale });
    }
  }, [isAuthenticated, locale, router]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);
    setUnverifiedBanner(false);

    const nextErrors: Record<string, string> = {};

    if (!username.trim()) {
      nextErrors.username = tAuth("usernameRequired");
    }
    if (!password) {
      nextErrors.password = tAuth("passwordRequired");
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await login({ username, password });
      // Confirm the Set-Cookie actually reached the browser before declaring
      // success — otherwise the user gets a flash of "logged in" followed by
      // a 401 bounce on the first authenticated dashboard request. The
      // verifier returns a discriminated outcome so we only push the user
      // toward the cookie-fix path when 401 is the actual signal; transient
      // 5xx / network / other-http failures are routed to their own error
      // copy and do NOT open the consent dialog.
      const verify = await verifySession();
      if (verify.kind !== "ok") {
        if (verify.kind === "cookie-missing") {
          // Roll back the server-side session/refresh-token/history-row
          // artifacts before re-prompting consent. Awaited so the request
          // is in-flight before we navigate / re-render heavily.
          await abortLogin(response.abortToken);
          await consent.reportFailure();
          setError(tConsent("loginCookieMissing"));
        } else if (verify.kind === "server-error") {
          setError(tErrors("serverError"));
        } else if (verify.kind === "network") {
          setError(tAuth("connectionLost"));
        } else {
          // other-http (403, 4xx that isn't 401) — neither cookie nor server
          // is the obvious culprit; surface a generic error.
          setError(tErrors("serverError"));
        }
        return;
      }
      consent.markVerified();
      setAuth(response);
      router.push("/dashboard", { locale });
    } catch (err) {
      if (err instanceof ApiError) {
        if (
          err.code === 403 &&
          err.message.toLowerCase().includes("not been verified")
        ) {
          setUnverifiedBanner(true);
        } else if (err.code === 401) {
          setError(tAuth("invalidCredentials"));
        } else {
          setError(translateCommonApiError(err, tErrors));
        }
      } else {
        setError(tAuth("connectionLost"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gradient-auth relative flex min-h-screen items-center justify-center overflow-hidden p-3 s:p-4 l:p-6">
      <CookieConsentDialog
        status={consent.status}
        apiOrigin={consent.apiOrigin}
        browser={consent.browser}
        onAllow={consent.request}
        onDecline={consent.decline}
        onAcknowledge={consent.acknowledge}
      />
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
          <CardTitle className="text-2xl font-bold">
            {tAuth("signInTitle")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {tAuth("signInSubtitle")}
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-4">
          {unverifiedBanner && (
            <div className="mb-5 rounded-lg border border-warning/40 bg-warning/15 p-4 text-sm font-medium text-warning dark:border-warning/50 dark:bg-warning/20">
              {tAuth("notVerified")}
            </div>
          )}

          {consent.status === "declined" && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning dark:border-warning/50 dark:bg-warning/15">
              <span className="font-medium">{tConsent("declinedBanner")}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={consent.reopen}
              >
                {tConsent("declinedBannerAction")}
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">{tAuth("usernameLabel")}</Label>
              <Input
                id="username"
                type="text"
                placeholder={tAuth("usernamePlaceholder")}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.username;
                      return next;
                    });
                  }
                }}
                aria-invalid={!!errors.username}
                autoComplete="username"
                autoFocus
              />
              {errors.username && (
                <InlineError message={errors.username} className="mt-1" />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{tAuth("passwordLabel")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={tAuth("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.password;
                        return next;
                      });
                    }
                  }}
                  aria-invalid={!!errors.password}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword ? tAuth("hidePassword") : tAuth("showPassword")
                  }
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" className="size-4" />
                  ) : (
                    <Eye aria-hidden="true" className="size-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <InlineError message={errors.password} className="mt-1" />
              )}
            </div>

            {error && <InlineError message={error} />}

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={loading}
            >
              {loading && (
                <Loader2
                  aria-hidden="true"
                  className="mr-2 size-4 animate-spin"
                />
              )}
              {tAuth("signInButton")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
