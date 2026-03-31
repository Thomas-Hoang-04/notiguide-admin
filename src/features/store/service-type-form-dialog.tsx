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
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { ApiError } from "@/types/api";
import type { ServiceTypeDto } from "@/types/store";
import { createServiceType, updateServiceType } from "./api";

const NAME_MAX = 100;
const PREFIX_MAX = 5;

interface ServiceTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceType?: ServiceTypeDto | null;
  storeId: string;
  onSuccess: () => void;
}

export function ServiceTypeFormDialog({
  open,
  onOpenChange,
  serviceType,
  storeId,
  onSuccess,
}: ServiceTypeFormDialogProps) {
  const isEdit = serviceType != null;

  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tStores = useTranslations("stores");
  const tValidation = useTranslations("validation");

  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [errors, setErrors] = useState<{ name?: string; prefix?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(serviceType?.name ?? "");
      setPrefix(serviceType?.prefix ?? "");
      setErrors({});
      setLoading(false);
    }
  }, [open, serviceType]);

  function validate(): boolean {
    const next: { name?: string; prefix?: string } = {};

    if (!name.trim()) {
      next.name = tValidation("nameRequired");
    } else if (name.trim().length > NAME_MAX) {
      next.name = tValidation("usernameMax", { max: NAME_MAX });
    }

    if (!prefix.trim()) {
      next.prefix = tValidation("nameRequired");
    } else if (prefix.trim().length > PREFIX_MAX) {
      next.prefix = tValidation("usernameMax", { max: PREFIX_MAX });
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      if (isEdit) {
        await updateServiceType(storeId, serviceType.id, {
          name: name.trim(),
          prefix: prefix.trim(),
        });
        toast.success(tStores("serviceTypeUpdated"));
      } else {
        await createServiceType(storeId, {
          name: name.trim(),
          prefix: prefix.trim(),
        });
        toast.success(tStores("serviceTypeCreated"));
      }
      onOpenChange(false);
      void onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 409) {
          setErrors({ prefix: tStores("serviceTypePrefixTaken") });
        } else if (err.details) {
          const next: { name?: string; prefix?: string } = {};
          if (err.details.name) next.name = err.details.name;
          if (err.details.prefix) next.prefix = err.details.prefix;
          if (Object.keys(next).length > 0) {
            setErrors(next);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? tStores("editServiceType") : tStores("addServiceType")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="service-type-name">
              {tStores("serviceTypeName")}
            </Label>
            <Input
              id="service-type-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tStores("serviceTypeNamePlaceholder")}
              maxLength={NAME_MAX}
              aria-invalid={!!errors.name}
              disabled={loading}
            />
            {errors.name && <InlineError message={errors.name} />}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="service-type-prefix">
              {tStores("serviceTypePrefix")}
            </Label>
            <Input
              id="service-type-prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder={tStores("serviceTypePrefixPlaceholder")}
              maxLength={PREFIX_MAX}
              aria-invalid={!!errors.prefix}
              disabled={loading}
              className="max-w-xs"
            />
            {errors.prefix && <InlineError message={errors.prefix} />}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? tCommon("save") : tCommon("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
