"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/store/auth";

interface LogoutConfirmDialogProps {
  children: React.ReactNode;
  trigger: React.ReactElement;
}

export function LogoutConfirmDialog({
  children,
  trigger,
}: LogoutConfirmDialogProps) {
  const tCommon = useTranslations("common");
  const tNavigation = useTranslations("navigation");
  const { logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!loggingOut) {
          setOpen(nextOpen);
        }
      }}
    >
      <AlertDialogTrigger disabled={loggingOut} render={trigger}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {tNavigation("logoutConfirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {tNavigation("logoutConfirmDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loggingOut}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleLogout();
            }}
            disabled={loggingOut}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loggingOut && <Loader2 className="mr-2 size-4 animate-spin" />}
            {tNavigation("logout")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
