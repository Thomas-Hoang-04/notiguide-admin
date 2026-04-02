"use client";

import type { StoreDto } from "@/types/store";
import { StoreAdminsContent } from "./store-admins-content";

interface StoreAdminsSectionProps {
  store: StoreDto;
}

export function StoreAdminsSection({ store }: StoreAdminsSectionProps) {
  return <StoreAdminsContent store={store} variant="section" />;
}
