"use client";

import { RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/inline-error";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStore, listStores } from "@/features/store/api";
import type { StoreDto } from "@/types/store";

interface StoreSelectorProps {
  value: string | null;
  onChange: (storeId: string) => void;
}

export function StoreSelector({ value, onChange }: StoreSelectorProps) {
  const tCommon = useTranslations("common");
  const tQueue = useTranslations("queue");
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    listStores(0, 100)
      .then((res) => setStores(res.items))
      .catch(() => setError(true));
  }, []);

  function fetchStores() {
    setError(false);
    listStores(0, 100)
      .then((res) => setStores(res.items))
      .catch(() => setError(true));
  }

  const selectedStore = stores.find((s) => s.id === value);

  return (
    <div className="space-y-2">
      {error ? (
        <div className="flex items-center gap-2">
          <InlineError message={tQueue("failedToLoadStores")} />
          <Button variant="ghost" size="sm" onClick={fetchStores}>
            <RefreshCcw className="mr-1 size-3" />
            {tCommon("retry")}
          </Button>
        </div>
      ) : (
        <Select
          value={value || ""}
          onValueChange={(v) => {
            if (v) onChange(v);
          }}
        >
          <SelectTrigger className="h-10 w-96 gap-2 px-3">
            <SelectValue placeholder={tQueue("selectStore")}>
              {value
                ? selectedStore
                  ? `${selectedStore.name}${!selectedStore.isActive ? ` ${tQueue("storeInactive")}` : ""}`
                  : "\u2026"
                : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            align="start"
            alignItemWithTrigger={false}
            className="p-1.5"
          >
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id} className="py-2">
                {s.name}
                {!s.isActive && ` ${tQueue("storeInactive")}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedStore && !selectedStore.isActive && (
        <div className="mt-6 rounded-lg border border-warning/40 bg-warning/15 p-3 text-sm font-medium text-warning dark:border-warning/50 dark:bg-warning/20">
          {tQueue("storeInactiveWarning")}
        </div>
      )}
    </div>
  );
}

export function useStoreName(storeId: string | null): string | null {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      setName(null);
      return;
    }
    getStore(storeId)
      .then((store) => setName(store.name))
      .catch(() => setName(null));
  }, [storeId]);

  return name;
}
