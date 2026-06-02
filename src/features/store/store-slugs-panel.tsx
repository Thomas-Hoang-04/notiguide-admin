"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { listSlugs } from "@/features/store/api";
import { SlugAddDialog } from "@/features/store/slug-add-dialog";
import { SlugRemoveDialog } from "@/features/store/slug-remove-dialog";
import { SlugRetireDialog } from "@/features/store/slug-retire-dialog";
import { SlugsList } from "@/features/store/slugs-list";
import { StoreManagementErrorBanner } from "@/features/store/store-management-error-banner";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { ApiError } from "@/types/api";
import type { StoreSlugDto, StoreSlugListResponse } from "@/types/store";

interface StoreSlugsPanelProps {
  storeId: string;
}

export function StoreSlugsPanel({ storeId }: StoreSlugsPanelProps) {
  const tStores = useTranslations("stores");

  const [data, setData] = useState<StoreSlugListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [retireTarget, setRetireTarget] = useState<StoreSlugDto | null>(null);
  const [removeTarget, setRemoveTarget] = useState<StoreSlugDto | null>(null);

  const t = useTranslations("errors");

  const fetchSlugs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await listSlugs(storeId));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? translateCommonApiError(err, t)
          : translateNetworkError(t),
      );
    } finally {
      setLoading(false);
    }
  }, [storeId, t]);

  useEffect(() => {
    void fetchSlugs();
  }, [fetchSlugs]);

  const atActiveCap = data ? data.activeCount >= data.activeMax : false;
  const atGraceCap = data ? data.graceCount >= data.graceMax : false;
  const bothFull = atActiveCap && atGraceCap;
  const willAutoRetire = atActiveCap && !atGraceCap;
  const oldestActiveSlug =
    data?.items.find((i) => i.status === "ACTIVE" && !i.isDefault)?.slug ??
    null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{tStores("slugs")}</h3>
          <p className="text-xs text-muted-foreground">
            {tStores("slugsDescription")}
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} disabled={bothFull}>
          <Plus className="mr-1.5 size-4" />
          {tStores("addSlug")}
        </Button>
      </div>

      {data && (
        <p className="text-xs text-muted-foreground">
          {tStores("slugCounts", {
            active: data.activeCount,
            activeMax: data.activeMax,
            grace: data.graceCount,
            graceMax: data.graceMax,
          })}
        </p>
      )}

      {bothFull && (
        <p className="rounded-xl border border-warning/40 bg-warning/15 p-3 text-xs text-warning dark:border-warning/50 dark:bg-warning/20">
          {tStores("slugBothFull")}
        </p>
      )}

      {error && (
        <StoreManagementErrorBanner
          error={error}
          onRetry={() => void fetchSlugs()}
        />
      )}

      <SlugsList
        items={data?.items ?? []}
        loading={loading}
        atGraceCap={atGraceCap}
        onRetire={setRetireTarget}
        onRemove={setRemoveTarget}
      />

      <SlugAddDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        storeId={storeId}
        willAutoRetire={willAutoRetire}
        oldestActiveSlug={oldestActiveSlug}
        onSuccess={() => void fetchSlugs()}
      />
      <SlugRetireDialog
        open={retireTarget != null}
        onOpenChange={(v) => !v && setRetireTarget(null)}
        slug={retireTarget}
        storeId={storeId}
        onSuccess={() => void fetchSlugs()}
      />
      <SlugRemoveDialog
        open={removeTarget != null}
        onOpenChange={(v) => !v && setRemoveTarget(null)}
        slug={removeTarget}
        storeId={storeId}
        onSuccess={() => void fetchSlugs()}
      />
    </div>
  );
}
