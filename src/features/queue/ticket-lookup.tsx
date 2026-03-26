"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

interface TicketLookupProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export function TicketLookup({
  searchQuery,
  onSearchQueryChange,
}: TicketLookupProps) {
  const tQueue = useTranslations("queue");

  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold">{tQueue("lookupTitle")}</h3>
      <div className="relative">
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
    </div>
  );
}
