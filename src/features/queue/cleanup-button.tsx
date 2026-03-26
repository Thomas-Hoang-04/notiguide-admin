"use client";

import { Loader2, Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cleanupServing } from "@/features/queue/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { ApiError } from "@/types/api";

interface CleanupButtonProps {
  storeId: string;
}

export function CleanupButton({ storeId }: CleanupButtonProps) {
  const tErrors = useTranslations("errors");
  const tQueue = useTranslations("queue");
  const [loading, setLoading] = useState(false);

  async function handleCleanup() {
    setLoading(true);
    try {
      const result = await cleanupServing(storeId);
      if (result.cleanedEntries > 0) {
        toast.success(
          tQueue("cleanupResult", { count: result.cleanedEntries }),
        );
      } else {
        toast.info(tQueue("cleanupClean"));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            onClick={handleCleanup}
            disabled={loading}
            className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive/40"
          />
        }
      >
        {loading ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Trash aria-hidden="true" className="size-4" />
        )}
        {tQueue("cleanupButton")}
      </TooltipTrigger>
      <TooltipContent side="left" sideOffset={12} className="max-w-xs">
        {tQueue("cleanupTooltip")}
      </TooltipContent>
    </Tooltip>
  );
}
