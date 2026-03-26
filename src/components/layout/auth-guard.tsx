"use client";

import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import { type ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/store/auth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isHydrated, hydrate } = useAuthStore();
  const router = useRouter();
  const locale = useLocale();
  const _pathname = usePathname();

  // Hydrate on mount and re-hydrate on every route change to pick up
  // store-assignment or role changes made by another super admin.
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login", { locale });
    }
  }, [isHydrated, isAuthenticated, locale, router]);

  if (!isHydrated) {
    return (
      <div className="bg-gradient-page flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
