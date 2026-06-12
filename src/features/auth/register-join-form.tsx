"use client";

import { useTranslations } from "next-intl";
import { InlineError } from "@/components/ui/inline-error";
import {
  RegisterFormActions,
  type RegisterFormProps,
  RegisterPasswordField,
  RegisterUsernameField,
  useRegisterForm,
} from "@/features/auth/register-form-shared";

interface RegisterJoinFormProps extends RegisterFormProps {
  /** The invite resolved in this page session — joining has no other path,
   * so the wizard only mounts this form once a token resolved. */
  invite: { token: string; targetName: string };
}

export function RegisterJoinForm({
  submitting,
  onBack,
  onSubmit,
  invite,
}: RegisterJoinFormProps) {
  const t = useTranslations("register");
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
      inviteToken: invite.token,
    }),
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="rounded-xl border border-success/40 bg-success/10 px-3.5 py-3 text-sm text-success dark:border-success/50 dark:bg-success/15">
        {t.rich("joiningTarget", {
          name: invite.targetName,
          bold: (chunks) => <span className="font-semibold">{chunks}</span>,
        })}
      </div>
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
      {errors.form && <InlineError message={errors.form} />}
      <RegisterFormActions
        submitting={submitting}
        onBack={onBack}
        submitLabel={t("submitJoin")}
      />
    </form>
  );
}
