"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { PASSWORD_RULES } from "@/lib/constants";
import { getPasswordRequirementStatuses } from "@/lib/password-validation";
import { cn } from "@/lib/utils";

type PasswordValidationChecklistProps = {
  className?: string;
  password: string;
};

export function PasswordValidationChecklist({
  className,
  password,
}: PasswordValidationChecklistProps) {
  const tValidation = useTranslations("validation");
  const statuses = [
    {
      checklistLabel: tValidation("reqLength", {
        min: PASSWORD_RULES.MIN_LENGTH,
        max: PASSWORD_RULES.MAX_LENGTH,
      }),
      passed:
        password.length >= PASSWORD_RULES.MIN_LENGTH &&
        password.length <= PASSWORD_RULES.MAX_LENGTH,
    },
    ...getPasswordRequirementStatuses(password).map((status) => ({
      checklistLabel: tValidation(status.requirementKey),
      passed: status.passed,
    })),
  ];

  return (
    <ul className={cn("space-y-2 text-xs py-1", className)}>
      {statuses.map((status) => (
        <li
          key={status.checklistLabel}
          className={cn(
            "flex items-center gap-2.5 py-0.5",
            status.passed ? "text-success" : "text-muted-foreground",
          )}
        >
          {status.passed ? (
            <Check className="size-3.5 shrink-0" />
          ) : (
            <span className="inline-block w-3.5 shrink-0 text-center leading-none">
              •
            </span>
          )}
          <span>{status.checklistLabel}</span>
        </li>
      ))}
    </ul>
  );
}
