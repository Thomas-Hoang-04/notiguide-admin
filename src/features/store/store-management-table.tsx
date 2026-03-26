"use client";

import { Pencil, Trash2, Users } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getStoreStatusTranslationKey } from "@/lib/i18n-keys";
import type { StoreDto, StorePageResponse } from "@/types/store";

type StoreManagementTableProps = {
  data: StorePageResponse | null;
  loading: boolean;
  onCreate: () => void;
  onDelete: (store: StoreDto) => void;
  onEdit: (store: StoreDto) => void;
  onViewAdmins: (store: StoreDto) => void;
};

export function StoreManagementTable({
  data,
  loading,
  onCreate,
  onDelete,
  onEdit,
  onViewAdmins,
}: StoreManagementTableProps) {
  const format = useFormatter();
  const tCommon = useTranslations("common");
  const tStores = useTranslations("stores");

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
                  colSpan={5}
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

            {data?.items.map((store) => (
              <tr
                key={store.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 font-medium">{store.name}</td>
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
                      onClick={() => onViewAdmins(store)}
                      className="text-primary hover:text-primary"
                      aria-label={tStores("viewAdminsButton")}
                    >
                      <Users aria-hidden="true" className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(store)}
                      aria-label={tStores("editButton")}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(store)}
                      className="text-destructive hover:text-destructive"
                      aria-label={tStores("deleteButton")}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
