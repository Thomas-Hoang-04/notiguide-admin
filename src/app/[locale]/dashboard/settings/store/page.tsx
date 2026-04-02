"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listServiceTypes } from "@/features/store/api";
import { StoreQueueSettingsContent } from "@/features/store/store-queue-settings-content";
import { useStoreQueueSettings } from "@/features/store/use-store-queue-settings";
import { useAuthStore } from "@/store/auth";
import type { ServiceTypeDto } from "@/types/store";

export default function StoreSettingsPage() {
  const tSettings = useTranslations("settings");
  const { storeId } = useAuthStore();

  // Default service type (localStorage)
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeDto[]>([]);
  const [defaultServiceTypeId, setDefaultServiceTypeId] = useState("");

  const {
    alertThreshold,
    allowJumpCall,
    allowNoShow,
    gracePeriodSec,
    handleSaveLimits,
    handleSaveNoShow,
    handleToggle,
    maxQueueSize,
    maxRequeues,
    noShowAction,
    requeueOffset,
    savingLimits,
    savingNoShow,
    setAlertThreshold,
    setGracePeriodSec,
    setMaxQueueSize,
    setMaxRequeues,
    setNoShowAction,
    setRequeueOffset,
    toggleLoading,
  } = useStoreQueueSettings({
    loadStoreToggles: true,
    storeId,
  });

  useEffect(() => {
    if (!storeId) return;
    const stored = localStorage.getItem(
      `store:${storeId}:defaultServiceTypeId`,
    );
    if (stored) setDefaultServiceTypeId(stored);
  }, [storeId]);

  useEffect(() => {
    if (!storeId) return;
    void (async () => {
      try {
        const types = await listServiceTypes(storeId);
        setServiceTypes(types);
      } catch {
        // ignore
      }
    })();
  }, [storeId]);

  function handleDefaultServiceTypeChange(value: string | null) {
    const nextValue = value ?? "";
    setDefaultServiceTypeId(nextValue);
    if (storeId) {
      if (nextValue) {
        localStorage.setItem(
          `store:${storeId}:defaultServiceTypeId`,
          nextValue,
        );
      } else {
        localStorage.removeItem(`store:${storeId}:defaultServiceTypeId`);
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Queue Defaults */}
      <Card className="glass-card glass-context-primary">
        <CardHeader>
          <CardTitle>{tSettings("store.queueDefaults")}</CardTitle>
          <CardDescription>
            {tSettings("store.queueDefaultsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>{tSettings("store.defaultServiceTypeLabel")}</Label>
            <Select
              value={defaultServiceTypeId}
              onValueChange={handleDefaultServiceTypeChange}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue
                  placeholder={tSettings("store.defaultServiceTypePlaceholder")}
                >
                  {(value: string | null) => {
                    const match = serviceTypes.find((st) => st.id === value);
                    return match ? match.name : null;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="p-1.5">
                {serviceTypes
                  .filter((st) => st.isActive)
                  .map((st) => (
                    <SelectItem key={st.id} value={st.id} className="py-2">
                      {st.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {tSettings("store.defaultServiceTypeCaption")}
            </p>
          </div>
        </CardContent>
      </Card>

      <StoreQueueSettingsContent
        alertThreshold={alertThreshold}
        allowJumpCall={allowJumpCall}
        allowNoShow={allowNoShow}
        gracePeriodId="gracePeriodSec"
        gracePeriodSec={gracePeriodSec}
        handleSaveLimits={handleSaveLimits}
        handleSaveNoShow={handleSaveNoShow}
        handleToggle={handleToggle}
        ids={{
          alertThreshold: "alertThreshold",
          maxQueueSize: "maxQueueSize",
          maxRequeues: "maxRequeues",
          requeueOffset: "requeueOffset",
        }}
        maxQueueSize={maxQueueSize}
        maxRequeues={maxRequeues}
        noShowAction={noShowAction}
        requeueOffset={requeueOffset}
        savingLimits={savingLimits}
        savingNoShow={savingNoShow}
        setAlertThreshold={setAlertThreshold}
        setGracePeriodSec={setGracePeriodSec}
        setMaxQueueSize={setMaxQueueSize}
        setMaxRequeues={setMaxRequeues}
        setNoShowAction={setNoShowAction}
        setRequeueOffset={setRequeueOffset}
        toggleLoading={toggleLoading}
      />
    </div>
  );
}
