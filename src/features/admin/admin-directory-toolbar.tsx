"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ROLES } from "@/lib/constants";
import type { StoreDto } from "@/types/store";

type AdminDirectoryToolbarProps = {
  isSuperAdmin: boolean;
  onCreateAdmin: () => void;
  onRoleFilterChange: (value: string | null) => void;
  onStoreFilterChange: (value: string | null) => void;
  roleFilter: string;
  storeFilter: string;
  stores: StoreDto[];
};

export function AdminDirectoryToolbar({
  isSuperAdmin,
  onCreateAdmin,
  onRoleFilterChange,
  onStoreFilterChange,
  roleFilter,
  storeFilter,
  stores,
}: AdminDirectoryToolbarProps) {
  const tAdmins = useTranslations("admins");

  return (
    <div className="mb-4 space-y-3 l:mb-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold l:text-2xl">{tAdmins("title")}</h1>
        {isSuperAdmin && (
          <Button
            onClick={onCreateAdmin}
            className="bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            <Plus className="mr-2 size-4" />
            {tAdmins("createButton")}
          </Button>
        )}
      </div>

      {isSuperAdmin && (
        <div className="flex flex-wrap items-center gap-2 s:gap-3">
          <Select value={roleFilter} onValueChange={onRoleFilterChange}>
            <SelectTrigger className="h-9 min-w-0 flex-1 gap-2 px-3 s:flex-none s:w-32 l:h-10 l:w-40">
              <span className="truncate">
                {roleFilter === "all"
                  ? tAdmins("filterAllRoles")
                  : roleFilter === ROLES.SUPER_ADMIN
                    ? tAdmins("filterSuperAdmin")
                    : tAdmins("filterAdmin")}
              </span>
            </SelectTrigger>
            <SelectContent
              align="start"
              alignItemWithTrigger={false}
              className="p-1.5"
            >
              <SelectItem value="all" className="py-2">
                {tAdmins("filterAllRoles")}
              </SelectItem>
              <SelectItem value={ROLES.SUPER_ADMIN} className="py-2">
                {tAdmins("filterSuperAdmin")}
              </SelectItem>
              <SelectItem value={ROLES.ADMIN} className="py-2">
                {tAdmins("filterAdmin")}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={storeFilter} onValueChange={onStoreFilterChange}>
            <SelectTrigger className="h-9 min-w-0 flex-1 gap-2 px-3 s:flex-none s:w-36 l:h-10 l:w-48">
              <span className="truncate">
                {storeFilter === "all"
                  ? tAdmins("filterAllStores")
                  : (stores.find((s) => s.id === storeFilter)?.name ??
                    tAdmins("filterByStore"))}
              </span>
            </SelectTrigger>
            <SelectContent
              align="start"
              alignItemWithTrigger={false}
              className="p-1.5"
            >
              <SelectItem value="all" className="py-2">
                {tAdmins("filterAllStores")}
              </SelectItem>
              {stores.map((s) => (
                <SelectItem key={s.id} value={s.id} className="py-2">
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
