"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import type { ServiceTypeDto } from "@/types/store";

interface ServiceTypesTableProps {
  items: ServiceTypeDto[];
  loading: boolean;
  onCreate: () => void;
  onEdit: (st: ServiceTypeDto) => void;
  onDelete: (st: ServiceTypeDto) => void;
  onToggleActive: (st: ServiceTypeDto) => void;
}

export function ServiceTypesTable({
  items,
  loading,
  onCreate,
  onEdit,
  onDelete,
  onToggleActive,
}: ServiceTypesTableProps) {
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
                {tStores("serviceTypeName")}
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-medium text-muted-foreground"
              >
                {tStores("serviceTypePrefix")}
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-medium text-muted-foreground"
              >
                {tStores("serviceTypeStatus")}
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-medium text-muted-foreground"
              >
                {tStores("serviceTypeActions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              items.length === 0 &&
              ["a", "b", "c"].map((id) => (
                <tr key={`skeleton-${id}`} className="border-b border-border">
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-10" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-8 w-16" />
                  </td>
                </tr>
              ))}

            {!loading && items.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {tStores("noServiceTypes")}
                  <br />
                  <Button
                    variant="link"
                    onClick={onCreate}
                    className="mt-2 text-primary"
                  >
                    {tStores("addServiceType")}
                  </Button>
                </td>
              </tr>
            )}

            {items.map((st) => (
              <tr key={st.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{st.name}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {st.prefix}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={st.isActive}
                      onCheckedChange={() => onToggleActive(st)}
                      size="sm"
                      aria-label={
                        st.isActive
                          ? tStores("serviceTypeActive")
                          : tStores("serviceTypeInactive")
                      }
                    />
                    <Badge
                      variant="outline"
                      className={
                        st.isActive
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                      }
                    >
                      {st.isActive
                        ? tStores("serviceTypeActive")
                        : tStores("serviceTypeInactive")}
                    </Badge>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(st)}
                      aria-label={tStores("editServiceType")}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(st)}
                      className="text-destructive hover:text-destructive"
                      aria-label={tStores("deleteServiceType")}
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
