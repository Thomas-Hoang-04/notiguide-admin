"use client";

import { Link2, Settings, ShieldCheck, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StoreAdminsSection } from "@/features/store/store-admins-section";
import { StoreGeneralSection } from "@/features/store/store-general-section";
import { StoreQueueSettingsSection } from "@/features/store/store-queue-settings-section";
import { StoreSlugsPanel } from "@/features/store/store-slugs-panel";
import type { StoreDto } from "@/types/store";

type TabId = "general" | "admins" | "queue" | "slugs";

interface StoreSettingsPanelProps {
  store: StoreDto;
  onStoreUpdated: (store: StoreDto) => void;
}

const TABS: { id: TabId; icon: typeof Settings }[] = [
  { id: "general", icon: ShieldCheck },
  { id: "admins", icon: Users },
  { id: "queue", icon: Settings },
  { id: "slugs", icon: Link2 },
];

export function StoreSettingsPanel({
  store,
  onStoreUpdated,
}: StoreSettingsPanelProps) {
  const tStores = useTranslations("stores");
  const [activeTab, setActiveTab] = useState<TabId>("general");

  function getTabLabel(id: TabId): string {
    switch (id) {
      case "general":
        return tStores("sectionGeneral");
      case "admins":
        return tStores("sectionAdmins");
      case "queue":
        return tStores("sectionQueueSettings");
      case "slugs":
        return tStores("sectionSlugs");
    }
  }

  return (
    <div className="glass-panel glass-panel-primary rounded-xl p-4 s:p-5">
      {/* Tab bar */}
      <div className="mb-4 flex gap-1 rounded-lg bg-muted/50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 gap-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              <span className="hidden s:inline">{getTabLabel(tab.id)}</span>
            </Button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "general" && (
          <StoreGeneralSection store={store} onSuccess={onStoreUpdated} />
        )}
        {activeTab === "admins" && <StoreAdminsSection store={store} />}
        {activeTab === "queue" && (
          <StoreQueueSettingsSection
            store={store}
            onStoreUpdated={onStoreUpdated}
          />
        )}
        {activeTab === "slugs" && <StoreSlugsPanel storeId={store.id} />}
      </div>
    </div>
  );
}
