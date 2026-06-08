"use client";

import { Building2, KeyRound, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RegisterMode } from "@/types/admin";

interface RegisterPathSelectorProps {
  onSelect: (mode: RegisterMode) => void;
}

const PATHS = [
  {
    mode: "CREATE_ORG",
    icon: Building2,
    titleKey: "pathOrgTitle",
    descKey: "pathOrgDesc",
  },
  {
    mode: "CREATE_STORE",
    icon: Store,
    titleKey: "pathStoreTitle",
    descKey: "pathStoreDesc",
  },
  {
    mode: "JOIN",
    icon: KeyRound,
    titleKey: "pathJoinTitle",
    descKey: "pathJoinDesc",
  },
] as const;

export function RegisterPathSelector({ onSelect }: RegisterPathSelectorProps) {
  const t = useTranslations("register");
  return (
    <div className="space-y-3">
      {PATHS.map(({ mode, icon: Icon, titleKey, descKey }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onSelect(mode)}
          className="flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent"
        >
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon aria-hidden="true" className="size-5" />
          </span>
          <span className="space-y-0.5">
            <span className="block text-sm font-semibold">{t(titleKey)}</span>
            <span className="block text-sm text-muted-foreground">
              {t(descKey)}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
