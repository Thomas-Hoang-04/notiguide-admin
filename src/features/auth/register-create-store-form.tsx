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

export function RegisterCreateStoreForm({
  submitting,
  onBack,
  onSubmit,
}: RegisterFormProps) {
  const t = useTranslations("register");
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
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
      mode: "CREATE_STORE",
      username,
      password,
      storeName,
      storeAddress: storeAddress.trim() || undefined,
    }),
    validateExtra: (e) => {
      if (!storeName.trim()) e.storeName = t("storeNameRequired");
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
        <Label htmlFor="reg-storename">{t("storeNameLabel")}</Label>
        <Input
          id="reg-storename"
          value={storeName}
          maxLength={255}
          placeholder={t("storeNamePlaceholder")}
          onChange={(e) => setStoreName(e.target.value)}
          aria-invalid={!!errors.storeName}
        />
        {errors.storeName && (
          <InlineError message={errors.storeName} className="mt-1" />
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-storeaddr">{t("storeAddressLabel")}</Label>
        <Input
          id="reg-storeaddr"
          value={storeAddress}
          maxLength={1000}
          placeholder={t("storeAddressPlaceholder")}
          onChange={(e) => setStoreAddress(e.target.value)}
        />
      </div>
      {errors.form && <InlineError message={errors.form} />}
      <RegisterFormActions
        submitting={submitting}
        onBack={onBack}
        submitLabel={t("submitStore")}
      />
    </form>
  );
}
