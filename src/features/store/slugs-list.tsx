"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { StoreSlugDto } from "@/types/store";

function daysUntil(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

interface SlugsListProps {
  items: StoreSlugDto[];
  loading: boolean;
  atGraceCap: boolean;
  onRetire: (slug: StoreSlugDto) => void;
  onRemove: (slug: StoreSlugDto) => void;
}

export function SlugsList({
  items,
  loading,
  atGraceCap,
  onRetire,
  onRemove,
}: SlugsListProps) {
  const tStores = useTranslations("stores");

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {tStores("noSlugs")}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {items.map((item) => (
        <li
          key={item.slug}
          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate font-mono text-sm">{item.slug}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {item.isDefault && (
                <Badge variant="secondary">{tStores("slugDefault")}</Badge>
              )}
              {item.status === "ACTIVE" && !item.isDefault && (
                <Badge variant="outline">{tStores("slugStatusActive")}</Badge>
              )}
              {item.status === "GRACE" && (
                <Badge
                  variant="outline"
                  className="border-warning/40 bg-warning/15 text-warning dark:border-warning/50 dark:bg-warning/20"
                >
                  {tStores("slugStatusRetiring")} ·{" "}
                  {tStores("slugExpiresIn", {
                    days: daysUntil(item.expiresAt),
                  })}
                </Badge>
              )}
            </div>
          </div>

          {item.isDefault ? (
            <span className="text-xs text-muted-foreground">
              {tStores("slugDefaultLocked")}
            </span>
          ) : (
            <div className="flex shrink-0 gap-1.5">
              {item.status === "ACTIVE" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRetire(item)}
                  disabled={atGraceCap}
                  title={
                    atGraceCap
                      ? tStores("slugGraceLimit", { max: 5 })
                      : undefined
                  }
                >
                  {tStores("retireSlug")}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onRemove(item)}
              >
                {tStores("removeSlug")}
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
