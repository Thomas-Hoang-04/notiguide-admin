"use client";

import { StoreSlugsPanel } from "@/features/store/store-slugs-panel";
import { useAuthStore } from "@/store/auth";

export default function SlugsSettingsPage() {
  const { storeId } = useAuthStore();

  if (!storeId) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <StoreSlugsPanel storeId={storeId} />
    </div>
  );
}
