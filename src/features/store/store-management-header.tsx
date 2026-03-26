"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type StoreManagementHeaderProps = {
  onCreate: () => void;
};

export function StoreManagementHeader({
  onCreate,
}: StoreManagementHeaderProps) {
  const tStores = useTranslations("stores");

  return (
    <div className="mb-4 flex items-center justify-between l:mb-6">
      <h1 className="text-xl font-bold l:text-2xl">{tStores("title")}</h1>
      <Button
        onClick={onCreate}
        className="bg-primary text-primary-foreground hover:bg-primary-hover"
      >
        <Plus className="mr-2 size-4" />
        {tStores("createButton")}
      </Button>
    </div>
  );
}
