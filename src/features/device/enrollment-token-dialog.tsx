"use client";

import { AlertCircle, Check, Copy, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { listStores } from "@/features/store/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/types/api";
import type { StoreDto } from "@/types/store";
import { issueEnrollmentToken } from "./api";

interface EnrollmentTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EnrollmentTokenDialog({
  open,
  onOpenChange,
  onSuccess,
}: EnrollmentTokenDialogProps) {
  const { isSuperAdmin, storeId: adminStoreId } = useAuthStore();
  const tCommon = useTranslations("common");
  const tDevices = useTranslations("devices");
  const tErrors = useTranslations("errors");
  const tQueue = useTranslations("queue");

  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setIssuedToken(null);
      setCopied(false);
      setStoreId(adminStoreId ?? "");
      if (isSuperAdmin) {
        listStores(0, 100)
          .then((res) => setStores(res.items))
          .catch(() => toast.error(tQueue("failedToLoadStores")));
      }
    }
  }, [open, isSuperAdmin, adminStoreId, tQueue]);

  async function handleIssue() {
    if (loading) return;
    setLoading(true);
    try {
      const result = await issueEnrollmentToken({
        storeId: storeId || null,
      });
      setIssuedToken(result.token);
      void onSuccess();
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

  async function handleCopy() {
    if (!issuedToken) return;
    try {
      await navigator.clipboard.writeText(issuedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(tDevices("tokens.copyFailed"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tDevices("tokens.issueTitle")}</DialogTitle>
        </DialogHeader>

        {issuedToken ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/15 p-3 text-sm text-warning dark:border-warning/50 dark:bg-warning/20">
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <span>{tDevices("tokens.oneTimeWarning")}</span>
            </div>
            <div className="space-y-2">
              <Label>{tDevices("tokens.tokenLabel")}</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm break-all">
                  {issuedToken}
                </code>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => void handleCopy()}
                  aria-label={tDevices("tokens.copy")}
                >
                  {copied ? (
                    <Check aria-hidden="true" className="size-4 text-success" />
                  ) : (
                    <Copy aria-hidden="true" className="size-4" />
                  )}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {tCommon("close")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label>{tDevices("tokens.storeLabel")}</Label>
                <Select
                  value={storeId}
                  onValueChange={(v) => v && setStoreId(v)}
                >
                  <SelectTrigger className="h-10 w-full gap-2 px-3">
                    <span>
                      {storeId
                        ? (stores.find((s) => s.id === storeId)?.name ??
                          tCommon("unknown"))
                        : tDevices("tokens.storePlaceholder")}
                    </span>
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    alignItemWithTrigger={false}
                    className="p-1.5"
                  >
                    {stores.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="py-2">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {tDevices("tokens.storeHelp")}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                onClick={() => void handleIssue()}
                className="bg-primary text-primary-foreground hover:bg-primary-hover"
                disabled={loading}
              >
                {loading && (
                  <Loader2
                    aria-hidden="true"
                    className="mr-2 size-4 animate-spin"
                  />
                )}
                {tDevices("tokens.issueButton")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
