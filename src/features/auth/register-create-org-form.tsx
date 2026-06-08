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

export function RegisterCreateOrgForm({
  submitting,
  onBack,
  onSubmit,
}: RegisterFormProps) {
  const t = useTranslations("register");
  const [orgName, setOrgName] = useState("");
  const {
    username,
    setUsername,
    password,
    setPassword,
    errors,
    buildSubmitHandler,
  } = useRegisterForm(submitting, onSubmit);

  const handleSubmit = buildSubmitHandler({
    buildRequest: () => ({ mode: "CREATE_ORG", username, password, orgName }),
    validateExtra: (e) => {
      if (!orgName.trim()) e.orgName = t("orgNameRequired");
    },
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
        <Label htmlFor="reg-orgname">{t("orgNameLabel")}</Label>
        <Input
          id="reg-orgname"
          value={orgName}
          maxLength={255}
          placeholder={t("orgNamePlaceholder")}
          onChange={(e) => setOrgName(e.target.value)}
          aria-invalid={!!errors.orgName}
        />
        {errors.orgName && (
          <InlineError message={errors.orgName} className="mt-1" />
        )}
      </div>
      {errors.form && <InlineError message={errors.form} />}
      <RegisterFormActions
        submitting={submitting}
        onBack={onBack}
        submitLabel={t("submitOrg")}
      />
    </form>
  );
}
