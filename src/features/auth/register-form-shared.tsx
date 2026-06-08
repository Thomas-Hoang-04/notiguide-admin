"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/inline-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordValidationChecklist } from "@/components/ui/password-validation-checklist";
import { PASSWORD_RULES, USERNAME_RULES } from "@/lib/constants";
import { getFirstMissingPasswordRequirementKey } from "@/lib/password-validation";
import type { RegisterRequest } from "@/types/admin";
import { ApiError } from "@/types/api";

export interface RegisterFormProps {
  submitting: boolean;
  onBack: () => void;
  onSubmit: (request: RegisterRequest) => Promise<string | null>;
}

interface SubmitConfig {
  buildRequest: () => RegisterRequest;
  validateExtra?: (errors: Record<string, string>) => void;
  mapApiError?: (error: ApiError) => Record<string, string> | undefined;
}

export function useRegisterForm(
  submitting: boolean,
  onSubmit: (request: RegisterRequest) => Promise<string | null>,
) {
  const tAuth = useTranslations("auth");
  const tAdmins = useTranslations("admins");
  const tValidation = useTranslations("validation");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function buildSubmitHandler({
    buildRequest,
    validateExtra,
    mapApiError,
  }: SubmitConfig) {
    return async (ev: React.SyntheticEvent) => {
      ev.preventDefault();
      if (submitting) return;

      const next: Record<string, string> = {};
      if (!username.trim()) next.username = tAuth("usernameRequired");
      else if (username.length < USERNAME_RULES.MIN_LENGTH)
        next.username = tValidation("usernameMin", {
          min: USERNAME_RULES.MIN_LENGTH,
        });
      else if (!USERNAME_RULES.PATTERN.test(username))
        next.username = tValidation("usernamePattern");

      if (!password) next.password = tAuth("passwordRequired");
      else {
        const missing = getFirstMissingPasswordRequirementKey(password);
        if (missing)
          next.password = tValidation("missingRequirement", {
            requirement: tValidation(missing),
          });
      }

      validateExtra?.(next);
      setErrors(next);
      if (Object.keys(next).length > 0) return;

      try {
        await onSubmit(buildRequest());
      } catch (err) {
        if (err instanceof ApiError && err.code === 409) {
          setErrors({ username: tAdmins("usernameTaken") });
        } else if (err instanceof ApiError) {
          setErrors(mapApiError?.(err) ?? { form: err.message });
        } else {
          setErrors({ form: tAuth("connectionLost") });
        }
      }
    };
  }

  return {
    username,
    setUsername,
    password,
    setPassword,
    errors,
    buildSubmitHandler,
  };
}

interface RegisterFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

interface RegisterFormActionsProps {
  submitting: boolean;
  onBack: () => void;
  submitLabel: string;
}

export function RegisterUsernameField({
  value,
  onChange,
  error,
}: RegisterFieldProps) {
  const tAdmins = useTranslations("admins");
  return (
    <div className="space-y-2">
      <Label htmlFor="reg-username">{tAdmins("usernameLabel")}</Label>
      <Input
        id="reg-username"
        value={value}
        maxLength={USERNAME_RULES.MAX_LENGTH}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        autoComplete="username"
      />
      {error && <InlineError message={error} className="mt-1" />}
    </div>
  );
}

export function RegisterPasswordField({
  value,
  onChange,
  error,
}: RegisterFieldProps) {
  const tAuth = useTranslations("auth");
  const tAdmins = useTranslations("admins");
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor="reg-password">{tAdmins("passwordLabel")}</Label>
      <div className="relative">
        <Input
          id="reg-password"
          type={showPassword ? "text" : "password"}
          value={value}
          maxLength={PASSWORD_RULES.MAX_LENGTH}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          autoComplete="new-password"
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
      <PasswordValidationChecklist password={value} className="mt-2" />
      {error && <InlineError message={error} className="mt-1" />}
    </div>
  );
}

export function RegisterFormActions({
  submitting,
  onBack,
  submitLabel,
}: RegisterFormActionsProps) {
  const t = useTranslations("register");
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        className="flex-1"
        onClick={onBack}
      >
        {t("back")}
      </Button>
      <Button
        type="submit"
        disabled={submitting}
        className="flex-1 bg-primary text-primary-foreground hover:bg-primary-hover"
      >
        {submitting && (
          <Loader2 aria-hidden="true" className="mr-2 size-4 animate-spin" />
        )}
        {submitLabel}
      </Button>
    </div>
  );
}
