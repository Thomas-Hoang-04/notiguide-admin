"use client";

import { CheckCircle, Loader2, Pencil, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InlineError } from "@/components/ui/inline-error";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { updateUsername } from "@/features/admin/api";
import { useMyOrg } from "@/features/organization/use-my-org";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { USERNAME_RULES } from "@/lib/constants";
import {
  getRoleTranslationKey,
  getVerificationTranslationKey,
} from "@/lib/i18n-keys";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/types/api";

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

export default function AccountPage() {
  const { admin, isSuperAdmin, updateAdmin } = useAuthStore();
  const { org, selfManaged } = useMyOrg();
  const format = useFormatter();
  const tAdmins = useTranslations("admins");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tSettings = useTranslations("settings");
  const tValidation = useTranslations("validation");

  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!admin) return null;

  function startEditing() {
    if (!admin) return;
    setNewUsername(admin.username);
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError(null);
  }

  async function handleSave() {
    const trimmed = newUsername.trim();

    if (trimmed.length < USERNAME_RULES.MIN_LENGTH) {
      setError(tValidation("usernameMin", { min: USERNAME_RULES.MIN_LENGTH }));
      return;
    }
    if (trimmed.length > USERNAME_RULES.MAX_LENGTH) {
      setError(tValidation("usernameMax", { max: USERNAME_RULES.MAX_LENGTH }));
      return;
    }
    if (!USERNAME_RULES.PATTERN.test(trimmed)) {
      setError(tValidation("usernamePattern"));
      return;
    }
    if (newUsername.trim() === admin?.username) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (!admin) return;
      const updated = await updateUsername(admin.id, { username: trimmed });
      updateAdmin(updated);
      toast.success(tSettings("usernameUpdated"));
      setEditing(false);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 409) {
          setError(tAdmins("usernameTaken"));
        } else if (err.details?.username) {
          const detail = err.details.username;
          if (detail.includes("letters") || detail.includes("underscores")) {
            setError(tValidation("usernamePattern"));
          } else {
            setError(translateCommonApiError(err, tErrors));
          }
        } else {
          setError(translateCommonApiError(err, tErrors));
        }
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card className="glass-card glass-context-primary">
        <CardHeader>
          <CardTitle>{tSettings("accountTitle")}</CardTitle>
          <CardDescription>{tSettings("accountDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {/* Username — editable */}
          <div className="flex items-center justify-between py-3">
            <span className="text-sm text-muted-foreground">
              {tSettings("usernameLabel")}
            </span>
            {editing ? (
              <div className="flex items-center gap-2">
                <div>
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="h-8 w-40 text-sm"
                    autoFocus
                    maxLength={USERNAME_RULES.MAX_LENGTH}
                    aria-invalid={!!error}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleSave();
                      if (e.key === "Escape") cancelEditing();
                    }}
                    disabled={saving}
                  />
                  {error && <InlineError message={error} className="mt-1" />}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="text-success hover:text-success"
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle className="size-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{admin.username}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={startEditing}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
          <Separator />
          <InfoRow label={tSettings("roleLabel")}>
            <Badge
              variant={isSuperAdmin ? "default" : "secondary"}
              className={
                isSuperAdmin
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }
            >
              {tSettings(getRoleTranslationKey(admin.role))}
            </Badge>
          </InfoRow>
          <Separator />
          <InfoRow label={tSettings("organizationTitle")}>
            {org ? (
              org.name
            ) : selfManaged ? (
              <Badge
                variant="outline"
                className="border-border text-muted-foreground"
              >
                {tCommon("selfManaged")}
              </Badge>
            ) : (
              "—"
            )}
          </InfoRow>
          <Separator />
          <InfoRow label={tSettings("storeLabel")}>
            {admin.storeName ?? tSettings("storeNone")}
          </InfoRow>
          <Separator />
          <InfoRow label={tSettings("statusLabel")}>
            <Badge
              variant="outline"
              className={
                admin.isVerified
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-warning/40 bg-warning/15 text-warning dark:border-warning/50 dark:bg-warning/20"
              }
            >
              {tSettings(getVerificationTranslationKey(admin.isVerified))}
            </Badge>
          </InfoRow>
          <Separator />
          <InfoRow label={tSettings("createdLabel")}>
            {admin.createdAt
              ? format.dateTime(new Date(admin.createdAt), {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : tCommon("unknown")}
          </InfoRow>
        </CardContent>
      </Card>
    </div>
  );
}
