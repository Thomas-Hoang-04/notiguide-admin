"use client";

import {
  CheckCircle2,
  Loader2,
  Monitor,
  Smartphone,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteAllSessions,
  getLoginHistory,
  listSessions,
  revokeAllOtherSessions,
  revokeSession,
} from "@/features/admin/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { parseUserAgent } from "@/lib/user-agent";
import { useAuthStore } from "@/store/auth";
import type { AdminSessionDto, LoginHistoryDto } from "@/types/admin";
import type { ApiError } from "@/types/api";

const HISTORY_PAGE_SIZE = 20;
const SESSION_SKELETON_KEYS = [
  "session-skeleton-1",
  "session-skeleton-2",
  "session-skeleton-3",
] as const;
const HISTORY_SKELETON_KEYS = [
  "history-skeleton-1",
  "history-skeleton-2",
  "history-skeleton-3",
  "history-skeleton-4",
  "history-skeleton-5",
] as const;

export default function SecuritySettingsPage() {
  const tSettings = useTranslations("settings");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");
  const { admin, logout } = useAuthStore();

  // Login history state
  const [history, setHistory] = useState<LoginHistoryDto[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [limit, setLimit] = useState(HISTORY_PAGE_SIZE);

  // Sessions state
  const [sessions, setSessions] = useState<AdminSessionDto[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const fetchHistory = useCallback(
    async (fetchLimit: number) => {
      if (!admin?.id) return;
      try {
        const result = await getLoginHistory(admin.id, fetchLimit);
        setHistory(result.items);
        setHasMore(result.hasMore);
      } catch (err) {
        const apiErr = err as ApiError;
        toast.error(
          apiErr?.code
            ? translateCommonApiError(apiErr, tErrors)
            : translateNetworkError(tErrors),
        );
      }
    },
    [admin?.id, tErrors],
  );

  const fetchSessions = useCallback(async () => {
    if (!admin?.id) return;
    try {
      const result = await listSessions(admin.id);
      setSessions(result);
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(
        apiErr?.code
          ? translateCommonApiError(apiErr, tErrors)
          : translateNetworkError(tErrors),
      );
    }
  }, [admin?.id, tErrors]);

  const loadSecurityData = useCallback(async () => {
    if (!admin?.id) return;

    setLimit(HISTORY_PAGE_SIZE);
    setHistoryLoading(true);
    setSessionsLoading(true);

    try {
      await Promise.all([fetchHistory(HISTORY_PAGE_SIZE), fetchSessions()]);
    } finally {
      setHistoryLoading(false);
      setSessionsLoading(false);
    }
  }, [admin?.id, fetchHistory, fetchSessions]);

  useEffect(() => {
    void loadSecurityData();
  }, [loadSecurityData]);

  async function handleLoadMore() {
    const newLimit = limit + HISTORY_PAGE_SIZE;
    setLoadingMore(true);
    try {
      setLimit(newLimit);
      await fetchHistory(newLimit);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleRevoke(sessionId: string) {
    if (!admin?.id) return;
    setRevokingId(sessionId);
    try {
      await revokeSession(admin.id, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success(tSettings("security.revokeSuccess"));
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(
        apiErr?.code
          ? translateCommonApiError(apiErr, tErrors)
          : translateNetworkError(tErrors),
      );
    } finally {
      setRevokingId(null);
    }
  }

  async function handleRevokeAll() {
    if (!admin?.id) return;
    setRevokingAll(true);
    try {
      const result = await revokeAllOtherSessions(admin.id);
      setSessions((prev) => prev.filter((s) => s.isCurrent));
      toast.success(
        tSettings("security.revokeAllSuccess", { count: result.revoked }),
      );
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(
        apiErr?.code
          ? translateCommonApiError(apiErr, tErrors)
          : translateNetworkError(tErrors),
      );
    } finally {
      setRevokingAll(false);
    }
  }

  async function handleDeleteAll() {
    if (!admin?.id) return;
    setDeletingAll(true);
    try {
      const result = await deleteAllSessions(admin.id);
      toast.success(
        tSettings("security.deleteAllSuccess", { count: result.revoked }),
      );
      await new Promise((resolve) => setTimeout(resolve, 800));
      await logout();
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(
        apiErr?.code
          ? translateCommonApiError(apiErr, tErrors)
          : translateNetworkError(tErrors),
      );
      setDeletingAll(false);
    }
  }

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;
  const totalSessionsCount = sessions.length;

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatRelativeTime(dateStr: string | null) {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return tSettings("security.lastActive", { time: "< 1m" });
    if (minutes < 60)
      return tSettings("security.lastActive", { time: `${minutes}m` });
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
      return tSettings("security.lastActive", { time: `${hours}h` });
    const days = Math.floor(hours / 24);
    return tSettings("security.lastActive", { time: `${days}d` });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Active Sessions */}
      <Card className="glass-card glass-context-primary">
        <CardHeader>
          <CardTitle>{tSettings("security.activeSessions")}</CardTitle>
          <CardDescription>
            {tSettings("security.activeSessionsDescription")}
          </CardDescription>
          {!sessionsLoading && totalSessionsCount > 0 && (
            <CardAction className="flex flex-wrap gap-2">
              {otherSessionsCount > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger
                    disabled={revokingAll || deletingAll}
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                      />
                    }
                  >
                    {revokingAll && (
                      <Loader2 className="mr-1 size-3 animate-spin" />
                    )}
                    {tSettings("security.revokeAll")}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {tSettings("security.revokeAll")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {tSettings("security.revokeAllConfirm", {
                          count: otherSessionsCount,
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.preventDefault();
                          void handleRevokeAll();
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {tSettings("security.revokeAll")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <AlertDialog>
                <AlertDialogTrigger
                  disabled={deletingAll || revokingAll}
                  render={
                    <Button
                      variant="destructive"
                      size="sm"
                    />
                  }
                >
                  {deletingAll && (
                    <Loader2 className="mr-1 size-3 animate-spin" />
                  )}
                  {tSettings("security.deleteAll")}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {tSettings("security.deleteAll")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {tSettings("security.deleteAllConfirm", {
                        count: totalSessionsCount,
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        void handleDeleteAll();
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {tSettings("security.deleteAll")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="space-y-3">
              {SESSION_SKELETON_KEYS.map((key) => (
                <Skeleton key={key} className="h-16 w-full" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {tSettings("security.noSessions")}
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const ua = parseUserAgent(session.userAgent);
                return (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="shrink-0 text-muted-foreground">
                      {ua.isMobile ? (
                        <Smartphone className="size-5" />
                      ) : (
                        <Monitor className="size-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {ua.browser !== "Unknown"
                            ? `${ua.browser} · ${ua.os}`
                            : tSettings("security.unknownDevice")}
                        </span>
                        {session.isCurrent && (
                          <Badge variant="success" className="text-xs">
                            {tSettings("security.thisDevice")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.ipAddress}
                        {session.lastActive &&
                          ` · ${formatRelativeTime(session.lastActive)}`}
                      </p>
                    </div>
                    {!session.isCurrent && (
                      <AlertDialog>
                        <AlertDialogTrigger
                          disabled={revokingId === session.id}
                          render={
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0 border-destructive text-destructive hover:bg-destructive/10"
                            />
                          }
                        >
                          {revokingId === session.id && (
                            <Loader2 className="mr-1 size-3 animate-spin" />
                          )}
                          {tSettings("security.revoke")}
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {tSettings("security.revoke")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {tSettings("security.revokeConfirm")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {tCommon("cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => {
                                e.preventDefault();
                                void handleRevoke(session.id);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {tSettings("security.revoke")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login History */}
      <Card className="glass-card glass-context-primary">
        <CardHeader>
          <CardTitle>{tSettings("security.loginHistory")}</CardTitle>
          <CardDescription>
            {tSettings("security.loginHistoryDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">
              {HISTORY_SKELETON_KEYS.map((key) => (
                <Skeleton key={key} className="h-12 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {tSettings("security.noHistory")}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">
                        {tSettings("security.date")}
                      </th>
                      <th className="pb-2 pr-4 font-medium">
                        {tSettings("security.ipAddress")}
                      </th>
                      <th className="pb-2 font-medium">
                        {tSettings("security.status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry) => (
                      <tr key={entry.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 text-foreground">
                          {formatDate(entry.createdAt)}
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">
                          {entry.ipAddress}
                        </td>
                        <td className="py-2.5">
                          {entry.success ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 className="size-3" />
                              {tSettings("security.loginSuccess")}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="size-3" />
                              {tSettings("security.loginFailed")}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    {tSettings("security.loadMore")}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
