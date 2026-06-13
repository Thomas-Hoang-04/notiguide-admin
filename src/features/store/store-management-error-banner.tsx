"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface StoreManagementErrorBannerProps {
  error: string;
  onRetry: () => void;
}

export function StoreManagementErrorBanner({
  error,
  onRetry,
}: StoreManagementErrorBannerProps) {
  const tCommon = useTranslations("common");

  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
      <AlertCircle className="size-3.5 shrink-0" />
      {error}
      <Button variant="ghost" size="sm" onClick={onRetry} className="ml-auto">
        <RefreshCcw className="mr-1 size-3" />
        {tCommon("retry")}
      </Button>
    </div>
  );
}
