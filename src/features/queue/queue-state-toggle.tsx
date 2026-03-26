"use client";

import { Loader2, PauseCircle, PlayCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { pauseQueue, resumeQueue } from "@/features/queue/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import type { ApiError } from "@/types/api";

interface QueueStateToggleProps {
  storeId: string;
  currentState: string;
  onStateChange: (state: string) => void;
}

export function QueueStateToggle({
  storeId,
  currentState,
  onStateChange,
}: QueueStateToggleProps) {
  const tErrors = useTranslations("errors");
  const tQueue = useTranslations("queue");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isActive = currentState === "ACTIVE";

  async function handlePause() {
    setLoading(true);
    try {
      await pauseQueue(storeId);
      toast.success(tQueue("pauseSuccess"));
      onStateChange("PAUSED");
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(
        apiErr?.code
          ? translateCommonApiError(apiErr, tErrors)
          : translateNetworkError(tErrors),
      );
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  async function handleResume() {
    setLoading(true);
    try {
      await resumeQueue(storeId);
      toast.success(tQueue("resumeSuccess"));
      onStateChange("ACTIVE");
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(
        apiErr?.code
          ? translateCommonApiError(apiErr, tErrors)
          : translateNetworkError(tErrors),
      );
    } finally {
      setLoading(false);
    }
  }

  if (isActive) {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => setConfirmOpen(true)}
          disabled={loading}
          className="gap-2 border-warning/30 text-warning hover:bg-warning/10 hover:text-warning"
        >
          {loading ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <PauseCircle aria-hidden="true" className="size-4" />
          )}
          {tQueue("pauseQueue")}
        </Button>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tQueue("pauseQueue")}</AlertDialogTitle>
              <AlertDialogDescription>
                {tQueue("confirmPause")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>
                {tCommon("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  void handlePause();
                }}
                disabled={loading}
                className="bg-warning text-warning-foreground hover:bg-warning/90"
              >
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {tQueue("pauseQueue")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => void handleResume()}
      disabled={loading}
      className="gap-2 border-success/30 text-success hover:bg-success/10 hover:text-success"
    >
      {loading ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <PlayCircle aria-hidden="true" className="size-4" />
      )}
      {tQueue("resumeQueue")}
    </Button>
  );
}
