"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getStoreSettings, updateStoreSettings } from "@/features/queue/api";
import { getStore, updateStore } from "@/features/store/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import type { ApiError } from "@/types/api";
import type { StoreDto, StoreSettingsDto } from "@/types/store";
import type { NoShowAction } from "./store-queue-settings-fields";

type StoreQueueToggleField = "allowJumpCall" | "allowNoShow";

interface UseStoreQueueSettingsOptions {
  initialStore?: Pick<StoreDto, "allowJumpCall" | "allowNoShow"> | null;
  loadStoreToggles?: boolean;
  onStoreUpdated?: (store: StoreDto) => void;
  storeId: string | null;
}

const DEFAULT_QUEUE_SETTINGS = {
  alertThreshold: "2",
  gracePeriodSec: "0",
  maxQueueSize: "0",
  maxRequeues: "1",
  noShowAction: "SKIP" as NoShowAction,
  requeueOffset: "3",
};

function normalizeNoShowAction(value: string | null | undefined): NoShowAction {
  return value === "REQUEUE" ? "REQUEUE" : "SKIP";
}

function mapStoreSettingsToFormValues(settings: StoreSettingsDto) {
  return {
    alertThreshold: String(settings.alertThreshold),
    gracePeriodSec: String(settings.gracePeriodSec),
    maxQueueSize: String(settings.maxQueueSize),
    maxRequeues: String(settings.maxRequeues),
    noShowAction: normalizeNoShowAction(settings.noShowAction),
    requeueOffset: String(settings.requeueOffset),
  };
}

export function useStoreQueueSettings({
  initialStore,
  loadStoreToggles = false,
  onStoreUpdated,
  storeId,
}: UseStoreQueueSettingsOptions) {
  const tErrors = useTranslations("errors");
  const tSettings = useTranslations("settings");

  const [fetching, setFetching] = useState(!!storeId);
  const [allowJumpCall, setAllowJumpCall] = useState(
    initialStore?.allowJumpCall ?? false,
  );
  const [allowNoShow, setAllowNoShow] = useState(
    initialStore?.allowNoShow ?? false,
  );
  const [toggleLoading, setToggleLoading] =
    useState<StoreQueueToggleField | null>(null);
  const [maxQueueSize, setMaxQueueSize] = useState(
    DEFAULT_QUEUE_SETTINGS.maxQueueSize,
  );
  const [gracePeriodSec, setGracePeriodSec] = useState(
    DEFAULT_QUEUE_SETTINGS.gracePeriodSec,
  );
  const [noShowAction, setNoShowAction] = useState<NoShowAction>(
    DEFAULT_QUEUE_SETTINGS.noShowAction,
  );
  const [maxRequeues, setMaxRequeues] = useState(
    DEFAULT_QUEUE_SETTINGS.maxRequeues,
  );
  const [requeueOffset, setRequeueOffset] = useState(
    DEFAULT_QUEUE_SETTINGS.requeueOffset,
  );
  const [alertThreshold, setAlertThreshold] = useState(
    DEFAULT_QUEUE_SETTINGS.alertThreshold,
  );
  const [savingLimits, setSavingLimits] = useState(false);
  const [savingNoShow, setSavingNoShow] = useState(false);
  const hasInitialStore = initialStore != null;
  const initialAllowJumpCall = initialStore?.allowJumpCall ?? false;
  const initialAllowNoShow = initialStore?.allowNoShow ?? false;

  const resetQueueSettings = useCallback(() => {
    setMaxQueueSize(DEFAULT_QUEUE_SETTINGS.maxQueueSize);
    setGracePeriodSec(DEFAULT_QUEUE_SETTINGS.gracePeriodSec);
    setNoShowAction(DEFAULT_QUEUE_SETTINGS.noShowAction);
    setMaxRequeues(DEFAULT_QUEUE_SETTINGS.maxRequeues);
    setRequeueOffset(DEFAULT_QUEUE_SETTINGS.requeueOffset);
    setAlertThreshold(DEFAULT_QUEUE_SETTINGS.alertThreshold);
  }, []);

  const applyQueueSettings = useCallback((settings: StoreSettingsDto) => {
    const values = mapStoreSettingsToFormValues(settings);
    setMaxQueueSize(values.maxQueueSize);
    setGracePeriodSec(values.gracePeriodSec);
    setNoShowAction(values.noShowAction);
    setMaxRequeues(values.maxRequeues);
    setRequeueOffset(values.requeueOffset);
    setAlertThreshold(values.alertThreshold);
  }, []);

  const showError = useCallback(
    (err: unknown) => {
      const apiErr = err as ApiError;
      toast.error(
        apiErr?.code
          ? translateCommonApiError(apiErr, tErrors)
          : translateNetworkError(tErrors),
      );
    },
    [tErrors],
  );

  useEffect(() => {
    if (loadStoreToggles || !hasInitialStore) {
      return;
    }

    setAllowJumpCall(initialAllowJumpCall);
    setAllowNoShow(initialAllowNoShow);
  }, [
    hasInitialStore,
    initialAllowJumpCall,
    initialAllowNoShow,
    loadStoreToggles,
  ]);

  useEffect(() => {
    if (!storeId) {
      setFetching(false);
      setAllowJumpCall(false);
      setAllowNoShow(false);
      resetQueueSettings();
      return;
    }

    let active = true;
    setFetching(true);
    resetQueueSettings();

    void (async () => {
      if (loadStoreToggles) {
        try {
          const currentStore = await getStore(storeId);
          if (!active) return;
          setAllowJumpCall(currentStore.allowJumpCall ?? false);
          setAllowNoShow(currentStore.allowNoShow ?? false);
        } catch {
          // ignore
        }
      }

      try {
        const settings = await getStoreSettings(storeId);
        if (!active) return;
        applyQueueSettings(settings);
      } catch {
        // keep defaults
      } finally {
        if (active) {
          setFetching(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [applyQueueSettings, loadStoreToggles, resetQueueSettings, storeId]);

  const handleToggle = useCallback(
    async (field: StoreQueueToggleField, checked: boolean) => {
      if (!storeId) return;

      const previousValue =
        field === "allowJumpCall" ? allowJumpCall : allowNoShow;

      if (field === "allowJumpCall") {
        setAllowJumpCall(checked);
      } else {
        setAllowNoShow(checked);
      }

      setToggleLoading(field);
      try {
        const updatedStore = await updateStore(storeId, { [field]: checked });
        setAllowJumpCall(updatedStore.allowJumpCall ?? false);
        setAllowNoShow(updatedStore.allowNoShow ?? false);
        onStoreUpdated?.(updatedStore);
        toast.success(tSettings("store.saved"));
      } catch (err) {
        if (field === "allowJumpCall") {
          setAllowJumpCall(previousValue);
        } else {
          setAllowNoShow(previousValue);
        }
        showError(err);
      } finally {
        setToggleLoading(null);
      }
    },
    [allowJumpCall, allowNoShow, onStoreUpdated, showError, storeId, tSettings],
  );

  const handleSaveLimits = useCallback(async () => {
    if (!storeId) return;

    setSavingLimits(true);
    try {
      await updateStoreSettings(storeId, {
        alertThreshold: Number(alertThreshold) || 2,
        maxQueueSize: Number(maxQueueSize) || 0,
      });
      toast.success(tSettings("store.saved"));
    } catch (err) {
      showError(err);
    } finally {
      setSavingLimits(false);
    }
  }, [alertThreshold, maxQueueSize, showError, storeId, tSettings]);

  const handleSaveNoShow = useCallback(async () => {
    if (!storeId) return;

    setSavingNoShow(true);
    try {
      await updateStoreSettings(storeId, {
        gracePeriodSec: Number(gracePeriodSec) || 0,
        maxRequeues: Number(maxRequeues) || 1,
        noShowAction,
        requeueOffset: Number(requeueOffset) || 3,
      });
      toast.success(tSettings("store.saved"));
    } catch (err) {
      showError(err);
    } finally {
      setSavingNoShow(false);
    }
  }, [
    gracePeriodSec,
    maxRequeues,
    noShowAction,
    requeueOffset,
    showError,
    storeId,
    tSettings,
  ]);

  return {
    alertThreshold,
    allowJumpCall,
    allowNoShow,
    fetching,
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
  };
}
