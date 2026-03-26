"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InlineError } from "@/components/ui/inline-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordValidationChecklist } from "@/components/ui/password-validation-checklist";
import { updatePassword } from "@/features/admin/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { PASSWORD_RULES } from "@/lib/constants";
import { getFirstMissingPasswordRequirementKey } from "@/lib/password-validation";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/types/api";

export default function PasswordChangePage() {
  const { admin, updateAdmin } = useAuthStore();
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const tSettings = useTranslations("settings");
  const tValidation = useTranslations("validation");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!oldPassword) {
      errs.oldPassword = tValidation("currentPasswordRequired");
    }

    if (!newPassword) {
      errs.newPassword = tValidation("newPasswordRequired");
    } else if (newPassword.length < PASSWORD_RULES.MIN_LENGTH) {
      errs.newPassword = tValidation("passwordMin", {
        min: PASSWORD_RULES.MIN_LENGTH,
      });
    } else if (newPassword.length > PASSWORD_RULES.MAX_LENGTH) {
      errs.newPassword = tValidation("passwordMax", {
        max: PASSWORD_RULES.MAX_LENGTH,
      });
    } else {
      const missingRequirementKey =
        getFirstMissingPasswordRequirementKey(newPassword);
      if (missingRequirementKey) {
        errs.newPassword = tValidation("missingRequirement", {
          requirement: tValidation(missingRequirementKey),
        });
      }
    }

    if (!confirmPassword) {
      errs.confirmPassword = tValidation("confirmPasswordRequired");
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = tValidation("passwordsDoNotMatch");
    }

    if (newPassword && oldPassword && newPassword === oldPassword) {
      errs.newPassword = tValidation("passwordMustDiffer");
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!validate() || !admin) return;

    setLoading(true);
    setErrors({});

    try {
      const updated = await updatePassword(admin.id, {
        oldPassword,
        newPassword,
      });
      updateAdmin(updated);
      toast.success(tSettings("passwordUpdated"));
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ApiError) {
        if (
          err.code === 400 &&
          err.message.toLowerCase().includes("old password")
        ) {
          setErrors({ oldPassword: tSettings("oldPasswordIncorrect") });
        } else if (err.details) {
          const nextErrors: Record<string, string> = {};

          if (err.details.oldPassword) {
            nextErrors.oldPassword = tValidation("currentPasswordRequired");
          }

          if (err.details.newPassword) {
            const detail = err.details.newPassword;
            if (detail.includes("uppercase")) {
              nextErrors.newPassword = tValidation("passwordMustContain");
            } else if (detail.toLowerCase().includes("blank")) {
              nextErrors.newPassword = tValidation("newPasswordRequired");
            }
          }

          if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
          } else {
            toast.error(translateCommonApiError(err, tErrors));
          }
        } else {
          toast.error(translateCommonApiError(err, tErrors));
        }
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card className="glass-card glass-context-primary">
        <CardHeader>
          <CardTitle>{tSettings("passwordTitle")}</CardTitle>
          <CardDescription>{tSettings("passwordDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">
                {tSettings("currentPassword")}
              </Label>
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
                aria-invalid={!!errors.oldPassword}
              />
              {errors.oldPassword && (
                <InlineError message={errors.oldPassword} className="mt-1" />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">{tSettings("newPassword")}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  aria-invalid={!!errors.newPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showNew ? tAuth("hidePassword") : tAuth("showPassword")
                  }
                >
                  {showNew ? (
                    <EyeOff aria-hidden="true" className="size-4" />
                  ) : (
                    <Eye aria-hidden="true" className="size-4" />
                  )}
                </button>
              </div>
              <PasswordValidationChecklist
                password={newPassword}
                className="mt-2"
              />
              {errors.newPassword && (
                <InlineError message={errors.newPassword} className="mt-1" />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {tSettings("confirmPassword")}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <InlineError
                  message={errors.confirmPassword}
                  className="mt-1"
                />
              )}
            </div>

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
              {tSettings("updatePasswordButton")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
