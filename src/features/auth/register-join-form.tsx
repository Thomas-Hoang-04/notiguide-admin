"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { InlineError } from "@/components/ui/inline-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RegisterFormActions,
  type RegisterFormProps,
  RegisterPasswordField,
  RegisterUsernameField,
  useRegisterForm,
} from "@/features/auth/register-form-shared";

export function RegisterJoinForm({
  submitting,
  onBack,
  onSubmit,
}: RegisterFormProps) {
  const t = useTranslations("register");
  const [joinCode, setJoinCode] = useState("");
  const {
    username,
    setUsername,
    password,
    setPassword,
    errors,
    buildSubmitHandler,
  } = useRegisterForm(submitting, onSubmit);

  const handleSubmit = buildSubmitHandler({
    buildRequest: () => ({
      mode: "JOIN",
      username,
      password,
      joinCode: joinCode.trim(),
    }),
    validateExtra: (e) => {
      if (!joinCode.trim()) e.joinCode = t("joinCodeRequired");
    },
    mapApiError: (err) =>
      err.message.toLowerCase().includes("join code")
        ? { joinCode: t("invalidJoinCode") }
        : undefined,
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <RegisterUsernameField
        value={username}
        onChange={setUsername}
        error={errors.username}
      />
      <RegisterPasswordField
        value={password}
        onChange={setPassword}
        error={errors.password}
      />
      <div className="space-y-2">
        <Label htmlFor="reg-joincode">{t("joinCodeLabel")}</Label>
        <Input
          id="reg-joincode"
          value={joinCode}
          maxLength={64}
          placeholder={t("joinCodePlaceholder")}
          className="font-mono"
          onChange={(e) => setJoinCode(e.target.value)}
          aria-invalid={!!errors.joinCode}
        />
        {errors.joinCode && (
          <InlineError message={errors.joinCode} className="mt-1" />
        )}
      </div>
      {errors.form && <InlineError message={errors.form} />}
      <RegisterFormActions
        submitting={submitting}
        onBack={onBack}
        submitLabel={t("submitJoin")}
      />
    </form>
  );
}
