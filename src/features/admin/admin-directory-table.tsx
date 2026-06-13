"use client";

import { CheckCircle, Loader2, ShieldCheck, Store, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getRoleTranslationKey,
  getVerificationTranslationKey,
} from "@/lib/i18n-keys";
import type { AdminDto, AdminPageResponse } from "@/types/admin";

interface AdminDirectoryTableProps {
  actionLoading: string | null;
  currentAdminId?: string;
  data: AdminPageResponse | null;
  isSuperAdmin: boolean;
  loading: boolean;
  onAssignStore: (admin: AdminDto) => void;
  onCreateAdmin: () => void;
  onRequestDelete: (admin: AdminDto) => void;
  onVerify: (admin: AdminDto) => void;
  resolveStoreName: (storeId: string | null) => string;
}

export function AdminDirectoryTable({
  actionLoading,
  currentAdminId,
  data,
  isSuperAdmin,
  loading,
  onAssignStore,
  onCreateAdmin,
  onRequestDelete,
  onVerify,
  resolveStoreName,
}: AdminDirectoryTableProps) {
  const format = useFormatter();
  const tAdmins = useTranslations("admins");
  const tCommon = useTranslations("common");

  return (
    <div className="glass-card glass-card-hover glass-context-primary rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] text-left text-sm xl:min-w-0">
          <thead>
            <tr className="border-b border-border">
              <th
                scope="col"
                className="px-4 py-3 font-medium text-muted-foreground"
              >
                {tAdmins("columnUsername")}
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-medium text-muted-foreground"
              >
                {tAdmins("columnRole")}
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 font-medium text-muted-foreground xl:table-cell"
              >
                {tAdmins("columnStore")}
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-medium text-muted-foreground"
              >
                {tAdmins("columnStatus")}
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 font-medium text-muted-foreground xl:table-cell"
              >
                {tAdmins("columnCreated")}
              </th>
              {isSuperAdmin && (
                <th
                  scope="col"
                  className="px-4 py-3 font-medium text-muted-foreground"
                >
                  {tAdmins("columnActions")}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading &&
              !data &&
              ["a", "b", "c", "d", "e"].map((id) => (
                <tr key={`skeleton-${id}`} className="border-b border-border">
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </td>
                  <td className="hidden px-4 py-3 xl:table-cell">
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </td>
                  <td className="hidden px-4 py-3 xl:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3">
                      <Skeleton className="h-8 w-20" />
                    </td>
                  )}
                </tr>
              ))}

            {!loading && data && data.items.length === 0 && (
              <tr>
                <td
                  colSpan={isSuperAdmin ? 6 : 5}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {tAdmins("emptyState")}
                  {isSuperAdmin && (
                    <>
                      <br />
                      <Button
                        variant="link"
                        onClick={onCreateAdmin}
                        className="mt-2 text-primary"
                      >
                        {tAdmins("emptyStateAction")}
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            )}

            {data?.items.map((admin) => {
              const isCurrentUser = admin.id === currentAdminId;
              return (
                <tr
                  key={admin.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{admin.username}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={
                        admin.role === "ROLE_SUPER_ADMIN"
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border"
                      }
                    >
                      {tAdmins(getRoleTranslationKey(admin.role))}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                    {admin.role === "ROLE_ADMIN" && !admin.storeId ? (
                      <Badge
                        variant="outline"
                        className="border-warning/40 bg-warning/15 text-warning dark:border-warning/50 dark:bg-warning/20"
                      >
                        {tAdmins("statusUnassigned")}
                      </Badge>
                    ) : (
                      admin.storeName || resolveStoreName(admin.storeId)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={
                        admin.isVerified
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-warning/40 bg-warning/15 text-warning dark:border-warning/50 dark:bg-warning/20"
                      }
                    >
                      {admin.isVerified ? (
                        <>
                          <CheckCircle
                            aria-hidden="true"
                            className="mr-1 size-3"
                          />
                          {tAdmins(
                            getVerificationTranslationKey(admin.isVerified),
                          )}
                        </>
                      ) : (
                        tAdmins(getVerificationTranslationKey(admin.isVerified))
                      )}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                    {admin.createdAt
                      ? format.dateTime(new Date(admin.createdAt), {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                        })
                      : tCommon("unknown")}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {!admin.isVerified ? (
                          isCurrentUser ? (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    disabled
                                    aria-label={tAdmins("verifyButton")}
                                  />
                                }
                              >
                                <ShieldCheck
                                  aria-hidden="true"
                                  className="size-4"
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                {tAdmins("cannotVerifySelf")}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onVerify(admin)}
                              disabled={actionLoading === admin.id}
                              className="text-success hover:text-success"
                              aria-label={tAdmins("verifyButton")}
                            >
                              {actionLoading === admin.id ? (
                                <Loader2
                                  aria-hidden="true"
                                  className="size-4 animate-spin"
                                />
                              ) : (
                                <ShieldCheck
                                  aria-hidden="true"
                                  className="size-4"
                                />
                              )}
                            </Button>
                          )
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled
                            className="opacity-30"
                            aria-label={tAdmins("verifyButton")}
                          >
                            <ShieldCheck
                              aria-hidden="true"
                              className="size-4"
                            />
                          </Button>
                        )}

                        {admin.role === "ROLE_ADMIN" && !admin.storeId && (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => onAssignStore(admin)}
                                  className="text-primary hover:text-primary"
                                  aria-label={tAdmins("assignStoreTooltip")}
                                />
                              }
                            >
                              <Store aria-hidden="true" className="size-4" />
                            </TooltipTrigger>
                            <TooltipContent>
                              {tAdmins("assignStoreButton")}
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {isCurrentUser ? (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  disabled
                                  aria-label={tAdmins("deleteButton")}
                                />
                              }
                            >
                              <Trash2 aria-hidden="true" className="size-4" />
                            </TooltipTrigger>
                            <TooltipContent>
                              {tAdmins("cannotDeleteSelf")}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onRequestDelete(admin)}
                            className="text-destructive hover:text-destructive"
                            aria-label={tAdmins("deleteButton")}
                          >
                            <Trash2 aria-hidden="true" className="size-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
