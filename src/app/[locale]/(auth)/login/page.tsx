"use client";

import { Loader2, Ticket } from "lucide-react";
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
import { login } from "@/features/auth/api";
import { useRouter } from "@/i18n/navigation";
import { translateCommonApiError } from "@/lib/api-error";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/types/api";

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const { isAuthenticated, login: setAuth } = useAuthStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unverifiedBanner, setUnverifiedBanner] = useState(false);
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
            <div className="mb-5 rounded-lg border border-warning/40 bg-warning/15 p-4 text-sm font-medium text-warning-foreground dark:border-warning/50 dark:bg-warning/20 dark:text-warning">
              {tAuth("notVerified")}
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
              <Input
                id="password"
                type="password"
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
