import { redirect } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({
    href: "/dashboard/settings/account",
    locale: locale as AppLocale,
  });
}
