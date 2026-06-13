"use client";

import { ChevronDown, Settings, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StoreSettingsPanel } from "@/features/store/store-settings-panel";
import { getStoreStatusTranslationKey } from "@/lib/i18n-keys";
import type { StoreDto, StorePageResponse } from "@/types/store";

interface StoreManagementTableProps {
  data: StorePageResponse | null;
  loading: boolean;
  onCreate: () => void;
  onDelete: (store: StoreDto) => void;
  onStoreUpdated: (store: StoreDto) => void;
}

export function StoreManagementTable({
  data,
  loading,
  onCreate,
  onDelete,
  onStoreUpdated,
}: StoreManagementTableProps) {
  const format = useFormatter();
  const tCommon = useTranslations("common");
  const tStores = useTranslations("stores");

  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpanded(storeId: string) {
    setExpandedId((prev) => (prev === storeId ? null : storeId));
  }

  return (
    <div className="glass-card glass-card-hover glass-context-primary rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm xl:min-w-0">
          <thead>
            <tr className="border-b border-border">
              <th
                scope="col"
                className="px-4 py-3 font-medium text-muted-foreground"
              >
                {tStores("columnName")}
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 font-medium text-muted-foreground l:table-cell"
              >
                {tStores("columnId")}
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 font-medium text-muted-foreground xl:table-cell"
              >
                {tStores("columnAddress")}
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-medium text-muted-foreground"
              >
                {tStores("columnStatus")}
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 font-medium text-muted-foreground xl:table-cell"
              >
                {tStores("columnCreated")}
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-medium text-muted-foreground"
              >
                {tStores("columnActions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              !data &&
              ["a", "b", "c", "d", "e"].map((id) => (
                <tr key={`skeleton-${id}`} className="border-b border-border">
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="hidden px-4 py-3 l:table-cell">
                    <Skeleton className="h-5 w-20 rounded-md" />
                  </td>
                  <td className="hidden px-4 py-3 xl:table-cell">
                    <Skeleton className="h-4 w-48" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </td>
                  <td className="hidden px-4 py-3 xl:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-8 w-20" />
                  </td>
                </tr>
              ))}

            {!loading && data && data.items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {tStores("emptyState")}
                  <br />
                  <Button
                    variant="link"
                    onClick={onCreate}
                    className="mt-2 text-primary"
                  >
                    {tStores("emptyStateAction")}
                  </Button>
                </td>
              </tr>
            )}

            {data?.items.map((store) => {
              const isExpanded = expandedId === store.id;

              return (
                <StoreRow
                  key={store.id}
                  store={store}
                  isExpanded={isExpanded}
                  onToggle={() => toggleExpanded(store.id)}
                  onDelete={() => onDelete(store)}
                  onStoreUpdated={onStoreUpdated}
                  format={format}
                  tCommon={tCommon}
                  tStores={tStores}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StoreRow({
  store,
  isExpanded,
  onToggle,
  onDelete,
  onStoreUpdated,
  format,
  tCommon,
  tStores,
}: {
  store: StoreDto;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onStoreUpdated: (store: StoreDto) => void;
  format: ReturnType<typeof useFormatter>;
  tCommon: ReturnType<typeof useTranslations>;
  tStores: ReturnType<typeof useTranslations>;
}) {
  const [isPanelMounted, setIsPanelMounted] = useState(isExpanded);
  const [isPanelVisible, setIsPanelVisible] = useState(isExpanded);

  useEffect(() => {
    if (!isExpanded) {
      setIsPanelVisible(false);
      return;
    }

    setIsPanelMounted(true);
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded || !isPanelMounted || isPanelVisible) {
      return;
    }

    let firstFrameId = 0;
    let secondFrameId = 0;

    firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        setIsPanelVisible(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);
    };
  }, [isExpanded, isPanelMounted, isPanelVisible]);

  return (
    <>
      <tr
        className={`border-b border-border ${isExpanded ? "bg-muted/30" : ""}`}
      >
        <td className="px-4 py-3 font-medium">{store.name}</td>
        <td className="hidden px-4 py-3 l:table-cell">
          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs tracking-wide text-muted-foreground">
            {store.publicId}
          </span>
        </td>
        <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
          {store.address || tCommon("none")}
        </td>
        <td className="px-4 py-3">
          <Badge
            variant="outline"
            className={
              store.isActive
                ? "border-success/30 bg-success/10 text-success"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }
          >
            {tStores(getStoreStatusTranslationKey(store.isActive))}
          </Badge>
        </td>
        <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
          {store.createdAt
            ? format.dateTime(new Date(store.createdAt), {
                year: "numeric",
                month: "numeric",
                day: "numeric",
              })
            : tCommon("unknown")}
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggle}
              aria-label={
                isExpanded
                  ? tStores("collapseSettings")
                  : tStores("expandSettings")
              }
              aria-expanded={isExpanded}
              className={`transition-colors ${isExpanded ? "text-primary" : ""}`}
            >
              {isExpanded ? (
                <ChevronDown aria-hidden="true" className="size-4" />
              ) : (
                <Settings aria-hidden="true" className="size-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
              aria-label={tStores("deleteButton")}
            >
              <Trash2 aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </td>
      </tr>
      {isPanelMounted && (
        <tr>
          <td colSpan={6} className="p-0">
            <div
              aria-hidden={!isPanelVisible}
              data-expanded={isPanelVisible ? "true" : "false"}
              className="store-settings-panel-shell"
              onTransitionEnd={(event) => {
                if (
                  event.target !== event.currentTarget ||
                  event.propertyName !== "grid-template-rows" ||
                  isExpanded
                ) {
                  return;
                }

                setIsPanelMounted(false);
              }}
            >
              <div className="store-settings-panel-clip">
                <div className="store-settings-panel-content px-3 pb-4 pt-4 s:px-4">
                  <StoreSettingsPanel
                    store={store}
                    onStoreUpdated={onStoreUpdated}
                  />
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
