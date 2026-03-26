"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { StorePageResponse } from "@/types/store";

type StoreManagementPaginationProps = {
  data: StorePageResponse;
  onNext: () => void;
  onPrev: () => void;
  page: number;
};

export function StoreManagementPagination({
  data,
  onNext,
  onPrev,
  page,
}: StoreManagementPaginationProps) {
  const tCommon = useTranslations("common");

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onPrev}
        disabled={page === 0}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-sm text-muted-foreground">
        {tCommon("pagination", { current: page + 1, total: data.totalPages })}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={page >= data.totalPages - 1}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
