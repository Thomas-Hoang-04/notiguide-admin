"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
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
import { InlineError } from "@/components/ui/inline-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordValidationChecklist } from "@/components/ui/password-validation-checklist";
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
import { PASSWORD_RULES, ROLES, USERNAME_RULES } from "@/lib/constants";
import { getFirstMissingPasswordRequirementKey } from "@/lib/password-validation";
import type { AdminRole } from "@/types/admin";
import { ApiError } from "@/types/api";
import type { StoreDto } from "@/types/store";
import { createAdmin } from "./api";

interface CreateAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateAdminDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAdminDialogProps) {
  const tAdmins = useTranslations("admins");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tQueue = useTranslations("queue");
  const tValidation = useTranslations("validation");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<AdminRole>(ROLES.ADMIN);
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setUsername("");
      setPassword("");
      setRole(ROLES.ADMIN);
      setStoreId("");
      setErrors({});
      listStores(0, 100)
        .then((res) => setStores(res.items))
        .catch(() => toast.error(tQueue("failedToLoadStores")));
    }
  }, [open, tQueue]);

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!username.trim()) {
      errs.username = tAuth("usernameRequired");
    } else if (username.length < USERNAME_RULES.MIN_LENGTH) {
      errs.username = tValidation("usernameMin", {
        min: USERNAME_RULES.MIN_LENGTH,
      });
    } else if (username.length > USERNAME_RULES.MAX_LENGTH) {
      errs.username = tValidation("usernameMax", {
        max: USERNAME_RULES.MAX_LENGTH,
      });
    } else if (!USERNAME_RULES.PATTERN.test(username)) {
      errs.username = tValidation("usernamePattern");
    }

    if (!password) {
      errs.password = tAuth("passwordRequired");
    } else if (password.length < PASSWORD_RULES.MIN_LENGTH) {
      errs.password = tValidation("passwordMin", {
        min: PASSWORD_RULES.MIN_LENGTH,
      });
    } else if (password.length > PASSWORD_RULES.MAX_LENGTH) {
      errs.password = tValidation("passwordMax", {
        max: PASSWORD_RULES.MAX_LENGTH,
      });
    } else {
      const missingRequirementKey =
        getFirstMissingPasswordRequirementKey(password);
      if (missingRequirementKey) {
        errs.password = tValidation("missingRequirement", {
          requirement: tValidation(missingRequirementKey),
        });
      }
    }

    // Store is now optional for ROLE_ADMIN — admin starts in Pending state if no store

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      await createAdmin({
        username,
        password,
        role,
        storeId: role === ROLES.SUPER_ADMIN ? null : storeId || null,
      });
      toast.success(tAdmins("createdToast"));
      onOpenChange(false);
      void onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 409) {
          setErrors({ username: tAdmins("usernameTaken") });
        } else if (err.details) {
          const nextErrors: Record<string, string> = {};

          if (err.details.username) {
            const detail = err.details.username;
            if (detail.includes("letters") || detail.includes("underscores")) {
              nextErrors.username = tValidation("usernamePattern");
            } else if (detail.toLowerCase().includes("blank")) {
              nextErrors.username = tAuth("usernameRequired");
            }
          }

          if (err.details.password) {
            const detail = err.details.password;
            if (detail.includes("uppercase")) {
              nextErrors.password = tValidation("passwordMustContain");
            } else if (detail.toLowerCase().includes("blank")) {
              nextErrors.password = tAuth("passwordRequired");
            }
          }

          if (err.details.storeId) {
            nextErrors.storeId = tAdmins("storeRequired");
          }

          if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
          } else {
            toast.error(translateCommonApiError(err, tErrors));
          }
        } else {
          toast.error(translateCommonApiError(err, tErrors));
        }
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setLoading(false);
    }
  }

  const isSuperAdminRole = role === ROLES.SUPER_ADMIN;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tAdmins("createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-username">{tAdmins("usernameLabel")}</Label>
            <Input
              id="admin-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={tAdmins("usernamePlaceholder")}
              maxLength={USERNAME_RULES.MAX_LENGTH}
              aria-invalid={!!errors.username}
            />
            {errors.username && (
              <InlineError message={errors.username} className="mt-1" />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">{tAdmins("passwordLabel")}</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tAdmins("passwordPlaceholder")}
                maxLength={PASSWORD_RULES.MAX_LENGTH}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={
                  showPassword ? tAuth("hidePassword") : tAuth("showPassword")
                }
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
            <PasswordValidationChecklist password={password} className="mt-2" />
            {errors.password && (
              <InlineError message={errors.password} className="mt-1" />
            )}
          </div>

          <div className="space-y-2">
            <Label>{tAdmins("roleLabel")}</Label>
            <Select
              value={role}
              onValueChange={(v) => {
                if (v) setRole(v as AdminRole);
              }}
            >
              <SelectTrigger className="h-10 w-full gap-2 px-3">
                <span>
                  {role === ROLES.SUPER_ADMIN
                    ? tAdmins("roleSuperAdmin")
                    : tAdmins("roleAdmin")}
                </span>
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                className="p-1.5"
              >
                <SelectItem value={ROLES.ADMIN} className="py-2">
                  {tAdmins("roleAdmin")}
                </SelectItem>
                <SelectItem value={ROLES.SUPER_ADMIN} className="py-2">
                  {tAdmins("roleSuperAdmin")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isSuperAdminRole && (
            <div className="space-y-2">
              <Label>{tAdmins("storeLabel")}</Label>
              <Select
                value={storeId}
                onValueChange={(v) => {
                  if (v) setStoreId(v);
                }}
              >
                <SelectTrigger
                  className="h-10 w-full gap-2 px-3"
                  aria-invalid={!!errors.storeId}
                >
                  <span>
                    {storeId
                      ? (stores.find((s) => s.id === storeId)?.name ??
                        tCommon("unknown"))
                      : tAdmins("storePlaceholder")}
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
              {errors.storeId && (
                <InlineError message={errors.storeId} className="mt-1" />
              )}
            </div>
          )}

          <div className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
            {isSuperAdminRole
              ? tAdmins("noteSuperAdmin")
              : storeId
                ? tAdmins("noteAdmin")
                : tAdmins("noteAdminPending")}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={loading}
            >
              {loading && (
                <Loader2
                  aria-hidden="true"
                  className="mr-2 size-4 animate-spin"
                />
              )}
              {tCommon("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
