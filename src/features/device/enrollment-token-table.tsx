"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { ApiError } from "@/types/api";
import type { EnrollmentTokenMetadataDto } from "@/types/device";
import { revokeEnrollmentToken } from "./api";

interface EnrollmentTokenTableProps {
  tokens: EnrollmentTokenMetadataDto[] | null;
  loading: boolean;
  resolveStoreName: (storeId: string | null) => string;
  onRevoked: () => void;
}

export function EnrollmentTokenTable({
  tokens,
  loading,
  resolveStoreName,
  onRevoked,
}: EnrollmentTokenTableProps) {
  const format = useFormatter();
  const tCommon = useTranslations("common");
  const tDevices = useTranslations("devices");
  const tErrors = useTranslations("errors");

  const [revokeTarget, setRevokeTarget] =
    useState<EnrollmentTokenMetadataDto | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  async function handleRevoke() {
    if (!revokeTarget) return;
    setRevokeLoading(true);
    try {
      await revokeEnrollmentToken(revokeTarget.tokenHash);
      toast.success(tDevices("tokens.revokedToast"));
      setRevokeTarget(null);
      onRevoked();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setRevokeLoading(false);
    }
  }

  function isExpired(expiresAt: string) {
    return new Date(expiresAt).getTime() < Date.now();
  }

  return (
    <>
      <div className="glass-card glass-card-hover glass-context-primary rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm xl:min-w-0">
            <thead>
              <tr className="border-b border-border">
                <th
                  scope="col"
                  className="px-4 py-3 font-medium text-muted-foreground"
                >
                  {tDevices("tokens.columnHash")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-medium text-muted-foreground"
                >
                  {tDevices("tokens.columnStore")}
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3 font-medium text-muted-foreground s:table-cell"
                >
                  {tDevices("tokens.columnIssued")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-medium text-muted-foreground"
                >
                  {tDevices("tokens.columnExpires")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 font-medium text-muted-foreground"
                >
                  {tDevices("tokens.columnActions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                !tokens &&
                ["a", "b", "c"].map((id) => (
                  <tr key={`skeleton-${id}`} className="border-b border-border">
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="hidden px-4 py-3 s:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-8 w-8" />
                    </td>
                  </tr>
                ))}

              {!loading && tokens && tokens.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    {tDevices("tokens.emptyState")}
                  </td>
                </tr>
              )}

              {tokens?.map((token) => {
                const expired = isExpired(token.expiresAt);
                return (
                  <tr
                    key={token.tokenHash}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <code className="font-mono text-xs text-muted-foreground">
                        {token.tokenHash.substring(0, 12)}...
                      </code>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {resolveStoreName(token.storeId)}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground s:table-cell">
                      {format.dateTime(new Date(token.issuedAt), {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          expired ? "text-destructive" : "text-muted-foreground"
                        }
                      >
                        {format.dateTime(new Date(token.expiresAt), {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        })}
                        {expired && (
                          <span className="ml-1 text-xs">
                            ({tDevices("tokens.expired")})
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setRevokeTarget(token)}
                              className="text-destructive hover:text-destructive"
                              aria-label={tDevices("tokens.revokeButton")}
                            />
                          }
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          {tDevices("tokens.revokeButton")}
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(v) => {
          if (!v) setRevokeTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tDevices("tokens.revokeTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tDevices("tokens.revokeConfirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeLoading}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleRevoke();
              }}
              disabled={revokeLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeLoading && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
