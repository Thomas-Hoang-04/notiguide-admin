"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type SyntheticEvent, useEffect, useState } from "react";
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
import { createSlug } from "@/features/store/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { ApiError } from "@/types/api";

const SLUG_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;
const SLUG_MIN = 3;
const SLUG_MAX = 128;

interface SlugAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  willAutoRetire: boolean;
  oldestActiveSlug: string | null;
  onSuccess: () => void;
}

export function SlugAddDialog({
  open,
  onOpenChange,
  storeId,
  willAutoRetire,
  oldestActiveSlug,
  onSuccess,
}: SlugAddDialogProps) {
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tStores = useTranslations("stores");

  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSlug("");
      setError(null);
      setLoading(false);
    }
  }, [open]);

  function validate(value: string): boolean {
    if (
      value.length < SLUG_MIN ||
      value.length > SLUG_MAX ||
      !SLUG_PATTERN.test(value)
    ) {
      setError(tStores("slugInvalid"));
      return false;
    }
    return true;
  }

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    if (loading) return;
    const trimmed = slug.trim();
    if (!validate(trimmed)) return;

    setLoading(true);
    setError(null);
    try {
      await createSlug(storeId, {
        slug: trimmed,
        confirmAutoRetire: willAutoRetire,
      });
      toast.success(tStores("slugCreated"));
      onOpenChange(false);
      void onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details?.slug) {
          setError(err.details.slug);
        } else if (err.code === 409) {
          toast.error(tStores("slugConflictRefresh"));
          void onSuccess();
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
          <DialogTitle>{tStores("addSlug")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {willAutoRetire && oldestActiveSlug && (
            <div className="flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/15 p-3 text-xs text-warning dark:border-warning/50 dark:bg-warning/20">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <span>
                {tStores("slugAutoRetireWarning", {
                  max: 5,
                  slug: oldestActiveSlug,
                })}
              </span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="slug-input">{tStores("slugLabel")}</Label>
            <Input
              id="slug-input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={tStores("slugPlaceholder")}
              maxLength={SLUG_MAX}
              aria-invalid={!!error}
              disabled={loading}
            />
            {error && <InlineError message={error} />}
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
              {tCommon("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
