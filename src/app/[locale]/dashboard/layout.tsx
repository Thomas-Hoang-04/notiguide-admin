// noinspection HtmlUnknownAnchorTarget

"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AuthGuard } from "@/components/layout/auth-guard";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SerialSessionProvider } from "@/lib/serial/serial-session";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/store/layout";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pageGradientClass = useLayoutStore((s) => s.pageGradientClass);
  const tCommon = useTranslations("common");

  return (
    <AuthGuard>
      <SerialSessionProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
        >
          {tCommon("skipToContent")}
        </a>
        <div
          className={cn(
            "flex h-screen overflow-hidden",
            pageGradientClass || "bg-gradient-page",
          )}
        >
          <div className="hidden xl:block">
            <Sidebar />
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar />
            <main
              id="main-content"
              className="flex-1 overflow-y-auto p-3 s:p-4 xl:p-5 3xl:p-6 4xl:p-8"
            >
              {children}
            </main>
          </div>
        </div>
      </SerialSessionProvider>
    </AuthGuard>
  );
}
