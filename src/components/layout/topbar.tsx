"use client";

import { LogOut, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMyOrg } from "@/features/organization/use-my-org";
import { getRoleTranslationKey } from "@/lib/i18n-keys";
import { useAuthStore } from "@/store/auth";
import { LanguageSwitcher } from "./language-switcher";
import { LogoutConfirmDialog } from "./logout-confirm-dialog";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  const tNavigation = useTranslations("navigation");
  const tCommon = useTranslations("common");
  const { admin, isSuperAdmin } = useAuthStore();
  const { org, selfManaged } = useMyOrg();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <header className="topbar-glass flex h-14 items-center justify-between px-3 s:px-4 xl:h-16 xl:px-5 3xl:px-6">
      {/* Mobile menu — visible below xl */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              aria-label={tNavigation("openMenu")}
            />
          }
        >
          <Menu aria-hidden="true" className="size-5" />
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-56 border-r-0! bg-transparent! p-0 shadow-none backdrop-blur-none!"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">
            {tNavigation("mobileNavTitle")}
          </SheetTitle>
          <Sidebar onNavigate={closeMobileMenu} />
        </SheetContent>
      </Sheet>

      <div className="hidden xl:block" />

      <div className="flex items-center gap-2 s:gap-3">
        {admin && (
          <>
            <span className="hidden text-sm font-medium s:inline">
              {admin.username}
            </span>
            {org && (
              <span className="hidden text-sm text-muted-foreground s:inline">
                {org.name}
              </span>
            )}
            {selfManaged && (
              <Badge
                variant="outline"
                className="border-border text-muted-foreground"
              >
                {tCommon("selfManaged")}
              </Badge>
            )}
            <Badge
              variant={isSuperAdmin ? "default" : "secondary"}
              className={
                isSuperAdmin
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }
            >
              {tNavigation(getRoleTranslationKey(admin.role))}
            </Badge>
            {admin.storeName && (
              <span className="hidden text-xs text-muted-foreground l:inline">
                {admin.storeName}
              </span>
            )}
          </>
        )}
        <LanguageSwitcher />
        <ThemeToggle />
        <LogoutConfirmDialog
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label={tNavigation("logout")}
            />
          }
        >
          <LogOut aria-hidden="true" className="size-4" />
        </LogoutConfirmDialog>
      </div>
    </header>
  );
}
