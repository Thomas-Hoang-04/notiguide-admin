"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getStoreSettings, updateStoreSettings } from "@/features/queue/api";
import { getStore, updateStore } from "@/features/store/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { useAuthStore } from "@/store/auth";
import type { ApiError } from "@/types/api";
import type { StoreSettingsDto } from "@/types/store";

export default function StoreSettingsPage() {
  const tSettings = useTranslations("settings");
  const tErrors = useTranslations("errors");
  const { storeId } = useAuthStore();

  // Default counter ID (localStorage)
  const [counterId, setCounterId] = useState("");

  // Store-level settings
  const [allowJumpCall, setAllowJumpCall] = useState(false);
  const [jumpCallLoading, setJumpCallLoading] = useState(false);

  // Queue limits
  const [settings, setSettings] = useState<StoreSettingsDto | null>(null);
  const [maxQueueSize, setMaxQueueSize] = useState("0");
  const [limitsLoading, setLimitsLoading] = useState(false);

  // No-show handling
  const [gracePeriodSec, setGracePeriodSec] = useState("0");
  const [noShowAction, setNoShowAction] = useState("SKIP");
  const [maxRequeues, setMaxRequeues] = useState("1");
  const [requeueOffset, setRequeueOffset] = useState("3");
  const [alertThreshold, setAlertThreshold] = useState("2");
  const [noShowLoading, setNoShowLoading] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    const stored = localStorage.getItem(`store:${storeId}:defaultCounterId`);
    if (stored) setCounterId(stored);
  }, [storeId]);

  useEffect(() => {
    if (!storeId) return;
    void (async () => {
      try {
        const store = await getStore(storeId);
        setAllowJumpCall(store.allowJumpCall);
      } catch {
        // ignore
      }
      try {
        const s = await getStoreSettings(storeId);
        setSettings(s);
        setMaxQueueSize(String(s.maxQueueSize));
        setGracePeriodSec(String(s.gracePeriodSec));
        setNoShowAction(s.noShowAction);
        setMaxRequeues(String(s.maxRequeues));
        setRequeueOffset(String(s.requeueOffset));
        setAlertThreshold(String(s.alertThreshold));
      } catch {
        // ignore
      }
    })();
  }, [storeId]);

  function handleCounterIdChange(value: string) {
    const trimmed = value.slice(0, 100);
    setCounterId(trimmed);
    if (storeId) {
      if (trimmed) {
        localStorage.setItem(`store:${storeId}:defaultCounterId`, trimmed);
      } else {
        localStorage.removeItem(`store:${storeId}:defaultCounterId`);
      }
    }
  }

  async function handleJumpCallToggle(checked: boolean) {
    if (!storeId) return;
    setJumpCallLoading(true);
    try {
      await updateStore(storeId, { allowJumpCall: checked });
      setAllowJumpCall(checked);
      toast.success(tSettings("store.saved"));
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(
        apiErr?.code
          ? translateCommonApiError(apiErr, tErrors)
          : translateNetworkError(tErrors),
      );
    } finally {
      setJumpCallLoading(false);
    }
  }

  async function handleSaveLimits() {
    if (!storeId) return;
    setLimitsLoading(true);
    try {
      const s = await updateStoreSettings(storeId, {
        maxQueueSize: Number(maxQueueSize) || 0,
        alertThreshold: Number(alertThreshold) || 2,
      });
      setSettings(s);
      toast.success(tSettings("store.saved"));
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(
        apiErr?.code
          ? translateCommonApiError(apiErr, tErrors)
          : translateNetworkError(tErrors),
      );
    } finally {
      setLimitsLoading(false);
    }
  }

  async function handleSaveNoShow() {
    if (!storeId) return;
    setNoShowLoading(true);
    try {
      const s = await updateStoreSettings(storeId, {
        gracePeriodSec: Number(gracePeriodSec) || 0,
        noShowAction,
        maxRequeues: Number(maxRequeues) || 1,
        requeueOffset: Number(requeueOffset) || 3,
      });
      setSettings(s);
      toast.success(tSettings("store.saved"));
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(
        apiErr?.code
          ? translateCommonApiError(apiErr, tErrors)
          : translateNetworkError(tErrors),
      );
    } finally {
      setNoShowLoading(false);
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
            <Label htmlFor="defaultCounterId">
              {tSettings("store.defaultCounterIdLabel")}
            </Label>
            <Input
              id="defaultCounterId"
              value={counterId}
              onChange={(e) => handleCounterIdChange(e.target.value)}
              placeholder={tSettings("store.defaultCounterIdPlaceholder")}
              maxLength={100}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              {tSettings("store.defaultCounterIdCaption")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Queue Behavior */}
      <Card className="glass-card glass-context-primary">
        <CardHeader>
          <CardTitle>{tSettings("store.queueBehavior")}</CardTitle>
          <CardDescription>
            {tSettings("store.queueBehaviorDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>{tSettings("store.allowJumpCallLabel")}</Label>
              <p className="text-xs text-muted-foreground">
                {tSettings("store.allowJumpCallCaption")}
              </p>
            </div>
            <Switch
              checked={allowJumpCall}
              onCheckedChange={handleJumpCallToggle}
              disabled={jumpCallLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Queue Limits */}
      <Card className="glass-card glass-context-primary">
        <CardHeader>
          <CardTitle>{tSettings("store.queueLimits")}</CardTitle>
          <CardDescription>
            {tSettings("store.queueLimitsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxQueueSize">
              {tSettings("store.maxQueueSizeLabel")}
            </Label>
            <Input
              id="maxQueueSize"
              type="number"
              min={0}
              value={maxQueueSize}
              onChange={(e) => setMaxQueueSize(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              {tSettings("store.maxQueueSizeCaption")}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="alertThreshold">
              {tSettings("store.alertThresholdLabel")}
            </Label>
            <Input
              id="alertThreshold"
              type="number"
              min={1}
              max={10}
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              {tSettings("store.alertThresholdCaption")}
            </p>
          </div>
          <Button
            onClick={handleSaveLimits}
            disabled={limitsLoading}
            size="sm"
          >
            {limitsLoading && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            {tSettings("store.saveButton")}
          </Button>
        </CardContent>
      </Card>

      {/* No-Show Handling */}
      <Card className="glass-card glass-context-primary">
        <CardHeader>
          <CardTitle>{tSettings("store.noShowHandling")}</CardTitle>
          <CardDescription>
            {tSettings("store.noShowHandlingDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gracePeriodSec">
              {tSettings("store.gracePeriodLabel")}
            </Label>
            <Input
              id="gracePeriodSec"
              type="number"
              min={0}
              max={600}
              value={gracePeriodSec}
              onChange={(e) => setGracePeriodSec(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              {tSettings("store.gracePeriodCaption")}
            </p>
          </div>
          <div className="space-y-2">
            <Label>{tSettings("store.noShowActionLabel")}</Label>
            <Select value={noShowAction} onValueChange={setNoShowAction}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue>
                  {(value: string | null) => {
                    if (value === "SKIP") return tSettings("store.noShowSkip");
                    if (value === "REQUEUE")
                      return tSettings("store.noShowRequeue");
                    return value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SKIP">
                  {tSettings("store.noShowSkip")}
                </SelectItem>
                <SelectItem value="REQUEUE">
                  {tSettings("store.noShowRequeue")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {noShowAction === "REQUEUE" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="maxRequeues">
                  {tSettings("store.maxRequeuesLabel")}
                </Label>
                <Input
                  id="maxRequeues"
                  type="number"
                  min={1}
                  max={5}
                  value={maxRequeues}
                  onChange={(e) => setMaxRequeues(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requeueOffset">
                  {tSettings("store.requeueOffsetLabel")}
                </Label>
                <Input
                  id="requeueOffset"
                  type="number"
                  min={1}
                  max={20}
                  value={requeueOffset}
                  onChange={(e) => setRequeueOffset(e.target.value)}
                  className="max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  {tSettings("store.requeueOffsetCaption")}
                </p>
              </div>
            </>
          )}
          <Button
            onClick={handleSaveNoShow}
            disabled={noShowLoading}
            size="sm"
          >
            {noShowLoading && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            {tSettings("store.saveButton")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
