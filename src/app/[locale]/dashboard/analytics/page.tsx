"use client";

import { useEffect } from "react";
import { AnalyticsOverview } from "@/features/analytics/analytics-overview";
import { StoreAnalytics } from "@/features/analytics/store-analytics";
import { useAuthStore } from "@/store/auth";
import { useLayoutStore } from "@/store/layout";

export default function AnalyticsPage() {
  const { isSuperAdmin, storeId } = useAuthStore();
  const { setPageGradientClass, clearPageGradientClass } = useLayoutStore();

  useEffect(() => {
    setPageGradientClass("bg-gradient-page");
    return () => clearPageGradientClass();
  }, [setPageGradientClass, clearPageGradientClass]);

  if (isSuperAdmin) {
    return <AnalyticsOverview />;
  }

  if (!storeId) {
    return null;
  }

  return <StoreAnalytics storeId={storeId} />;
}
