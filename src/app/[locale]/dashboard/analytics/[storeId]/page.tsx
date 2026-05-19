"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { StoreAnalytics } from "@/features/analytics/store-analytics";
import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/store/auth";
import { useLayoutStore } from "@/store/layout";

export default function StoreAnalyticsPage() {
  const params = useParams<{ storeId: string }>();
  const { isSuperAdmin } = useAuthStore();
  const { setPageGradientClass, clearPageGradientClass } = useLayoutStore();
  const router = useRouter();

  useEffect(() => {
    setPageGradientClass("bg-gradient-page");
    return () => clearPageGradientClass();
  }, [setPageGradientClass, clearPageGradientClass]);

  // Only super admins can access store drill-down
  useEffect(() => {
    if (!isSuperAdmin) {
      router.replace("/dashboard/analytics");
    }
  }, [isSuperAdmin, router]);

  if (!isSuperAdmin || !params.storeId) {
    return null;
  }

  return <StoreAnalytics storeId={params.storeId} showBackButton />;
}
