"use client";

import { RefreshCcw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TicketLookupProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onReload: () => void;
  reloading: boolean;
}

export function TicketLookup({
  searchQuery,
  onSearchQueryChange,
  onReload,
  reloading,
}: TicketLookupProps) {
  const tQueue = useTranslations("queue");

  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold">{tQueue("lookupTitle")}</h3>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder={tQueue("lookupPlaceholder")}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          disabled={reloading}
          onClick={onReload}
          aria-label={tQueue("reloadTickets")}
        >
          <RefreshCcw
            aria-hidden="true"
            className={`size-4 ${reloading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
    </div>
  );
}
