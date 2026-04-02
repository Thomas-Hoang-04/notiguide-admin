"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { NoShowAction } from "./store-queue-settings-fields";
import {
  StoreNoShowHandlingCard,
  StoreQueueBehaviorCard,
  StoreQueueLimitsCard,
} from "./store-queue-settings-fields";

type StoreQueueToggleField = "allowJumpCall" | "allowNoShow";

interface StoreQueueSettingsContentProps {
  alertThreshold: string;
  allowJumpCall: boolean;
  allowNoShow: boolean;
  gracePeriodId: string;
  gracePeriodSec: string;
  handleSaveLimits: () => Promise<void>;
  handleSaveNoShow: () => Promise<void>;
  handleToggle: (
    field: StoreQueueToggleField,
    checked: boolean,
  ) => Promise<void>;
  ids: {
    alertThreshold: string;
    maxQueueSize: string;
    maxRequeues: string;
    requeueOffset: string;
  };
  maxQueueSize: string;
  maxRequeues: string;
  noShowAction: NoShowAction;
  requeueOffset: string;
  savingLimits: boolean;
  savingNoShow: boolean;
  setAlertThreshold: (value: string) => void;
  setGracePeriodSec: (value: string) => void;
  setMaxQueueSize: (value: string) => void;
  setMaxRequeues: (value: string) => void;
  setNoShowAction: (value: NoShowAction) => void;
  setRequeueOffset: (value: string) => void;
  toggleLoading: StoreQueueToggleField | null;
}

export function StoreQueueSettingsContent({
  alertThreshold,
  allowJumpCall,
  allowNoShow,
  gracePeriodId,
  gracePeriodSec,
  handleSaveLimits,
  handleSaveNoShow,
  handleToggle,
  ids,
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
}: StoreQueueSettingsContentProps) {
  const tSettings = useTranslations("settings");

  return (
    <>
      <StoreQueueBehaviorCard
        allowJumpCall={allowJumpCall}
        allowJumpCallDisabled={toggleLoading === "allowJumpCall"}
        allowNoShow={allowNoShow}
        allowNoShowDisabled={toggleLoading === "allowNoShow"}
        onAllowJumpCallChange={(checked) => {
          void handleToggle("allowJumpCall", checked);
        }}
        onAllowNoShowChange={(checked) => {
          void handleToggle("allowNoShow", checked);
        }}
      />

      <StoreQueueLimitsCard
        maxQueueSizeId={ids.maxQueueSize}
        maxQueueSize={maxQueueSize}
        onMaxQueueSizeChange={setMaxQueueSize}
        alertThresholdId={ids.alertThreshold}
        alertThreshold={alertThreshold}
        onAlertThresholdChange={setAlertThreshold}
        footerAction={
          <Button onClick={handleSaveLimits} disabled={savingLimits} size="sm">
            {savingLimits && <Loader2 className="mr-2 size-4 animate-spin" />}
            {tSettings("store.saveButton")}
          </Button>
        }
      />

      <StoreNoShowHandlingCard
        visible={allowNoShow}
        gracePeriodId={gracePeriodId}
        gracePeriodSec={gracePeriodSec}
        onGracePeriodSecChange={setGracePeriodSec}
        noShowAction={noShowAction}
        onNoShowActionChange={setNoShowAction}
        maxRequeuesId={ids.maxRequeues}
        maxRequeues={maxRequeues}
        onMaxRequeuesChange={setMaxRequeues}
        requeueOffsetId={ids.requeueOffset}
        requeueOffset={requeueOffset}
        onRequeueOffsetChange={setRequeueOffset}
        footerAction={
          <Button onClick={handleSaveNoShow} disabled={savingNoShow} size="sm">
            {savingNoShow && <Loader2 className="mr-2 size-4 animate-spin" />}
            {tSettings("store.saveButton")}
          </Button>
        }
      />
    </>
  );
}
