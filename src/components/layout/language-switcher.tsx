"use client";

import { GB, VN } from "country-flag-icons/react/3x2";
import { useLocale } from "next-intl";
import { useTransition } from "react";
import { Toggle } from "@/components/ui/toggle";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const LOCALE_META = {
  vi: { Flag: VN, label: "Tiếng Việt" },
  en: { Flag: GB, label: "English" },
} as const;

type Locale = keyof typeof LOCALE_META;

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const nextLocale: Locale = locale === "vi" ? "en" : "vi";
  const { Flag } = LOCALE_META[locale];

  function handlePress() {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <Toggle
      variant="outline"
      size="sm"
      pressed={false}
      onPressedChange={handlePress}
      aria-label={LOCALE_META[nextLocale].label}
      className={cn(
        "gap-1.5 rounded-full px-2.5",
        isPending && "pointer-events-none opacity-60",
      )}
    >
      <Flag
        aria-hidden="true"
        className="h-3 w-[1.125rem] shrink-0 overflow-hidden rounded-[2px]"
      />
      <span className="text-xs font-semibold">{locale.toUpperCase()}</span>
    </Toggle>
  );
}
