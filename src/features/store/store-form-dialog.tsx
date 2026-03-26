"use client";

import { Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { STORE_RULES } from "@/lib/constants";
import { ApiError } from "@/types/api";
import type { StoreDto, UpdateStoreRequest } from "@/types/store";
import { createStore, updateStore } from "./api";

interface StoreFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store?: StoreDto | null;
  onSuccess: () => void;
}

export function StoreFormDialog({
  open,
  onOpenChange,
  store,
  onSuccess,
}: StoreFormDialogProps) {
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tStores = useTranslations("stores");
  const tValidation = useTranslations("validation");
  const isEdit = !!store;

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (store) {
        setName(store.name);
        setAddress(store.address || "");
        setIsActive(store.isActive);
      } else {
        setName("");
        setAddress("");
        setIsActive(true);
      }
      setErrors({});
    }
  }, [open, store]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = tValidation("nameRequired");
    } else if (name.length > STORE_RULES.NAME_MAX) {
      errs.name = tValidation("nameMax");
    }
    if (address.length > STORE_RULES.ADDRESS_MAX) {
      errs.address = tValidation("addressMax");
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit && store) {
        const request: UpdateStoreRequest = {};
        if (name !== store.name) request.name = name;
        if (address !== (store.address || "")) {
          request.address = address.trim() || null;
        }
        if (isActive !== store.isActive) request.isActive = isActive;

        if (Object.keys(request).length > 0) {
          await updateStore(store.id, request);
        }
        toast.success(tStores("updatedToast"));
      } else {
        await createStore({
          name,
          ...(address.trim() ? { address: address.trim() } : {}),
        });
        toast.success(tStores("createdToast"));
      }
      onOpenChange(false);
      void onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details) {
          const nextErrors: Record<string, string> = {};

          if (err.details.name) {
            nextErrors.name = err.details.name.toLowerCase().includes("blank")
              ? tValidation("nameRequired")
              : tValidation("nameMax");
          }

          if (err.details.address) {
            nextErrors.address = tValidation("addressMax");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-6 px-4 py-5 s:px-5 s:py-6">
        <DialogHeader className="pr-8">
          <DialogTitle>
            {isEdit ? tStores("editTitle") : tStores("createTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="space-y-2.5">
            <Label htmlFor="store-name">{tStores("nameLabel")}</Label>
            <Input
              id="store-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tStores("namePlaceholder")}
              maxLength={STORE_RULES.NAME_MAX}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <InlineError message={errors.name} className="mt-1" />
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="store-address">{tStores("addressLabel")}</Label>
            <Textarea
              id="store-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={tStores("addressPlaceholder")}
              rows={3}
              maxLength={STORE_RULES.ADDRESS_MAX}
              aria-invalid={!!errors.address}
            />
            {errors.address && (
              <InlineError message={errors.address} className="mt-1" />
            )}
          </div>

          {isEdit && (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 s:p-5">
              <div className="space-y-1">
                <Label htmlFor="store-active" className="font-medium">
                  {tStores("activeLabel")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {tStores("activeHelper")}
                </p>
              </div>
              <Switch
                id="store-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          )}

          <DialogFooter className="mt-2 -mx-6 -mb-6 p-6 s:-mx-7 s:-mb-7 s:px-7 s:py-5">
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
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? tCommon("save") : tCommon("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
