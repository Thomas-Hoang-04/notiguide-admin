"use client";

import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getStoreSettings, updateStoreSettings } from "@/features/queue/api";
import {
  getStore,
  listServiceTypes,
  updateServiceType,
  updateStore,
} from "@/features/store/api";
import { DeleteServiceTypeDialog } from "@/features/store/delete-service-type-dialog";
import { ServiceTypeFormDialog } from "@/features/store/service-type-form-dialog";
import { ServiceTypesTable } from "@/features/store/service-types-table";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import type { ApiError } from "@/types/api";
import type { ServiceTypeDto, StoreDto } from "@/types/store";

type NoShowAction = "SKIP" | "REQUEUE";

interface StoreSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreDto | null;
  onSuccess: () => void;
}

export function StoreSettingsDialog({
  open,
  onOpenChange,
  store,
  onSuccess,
}: StoreSettingsDialogProps) {
  const tSettings = useTranslations("settings");
  const tStores = useTranslations("stores");
  const tErrors = useTranslations("errors");

  const [fetching, setFetching] = useState(false);

  // Service type CRUD state
  const [stItems, setStItems] = useState<ServiceTypeDto[]>([]);
  const [stLoading, setStLoading] = useState(true);
  const [stFormOpen, setStFormOpen] = useState(false);
  const [stEditTarget, setStEditTarget] = useState<ServiceTypeDto | null>(null);
  const [stDeleteOpen, setStDeleteOpen] = useState(false);
  const [stDeleteTarget, setStDeleteTarget] = useState<ServiceTypeDto | null>(
    null,
  );

  // Store-level toggles
  const [allowJumpCall, setAllowJumpCall] = useState(false);
  const [allowNoShow, setAllowNoShow] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  // Queue settings
  const [maxQueueSize, setMaxQueueSize] = useState("0");
  const [gracePeriodSec, setGracePeriodSec] = useState("0");
  const [noShowAction, setNoShowAction] = useState<NoShowAction>("SKIP");
  const [maxRequeues, setMaxRequeues] = useState("1");
  const [requeueOffset, setRequeueOffset] = useState("3");
  const [alertThreshold, setAlertThreshold] = useState("2");
  const [savingLimits, setSavingLimits] = useState(false);
  const [savingNoShow, setSavingNoShow] = useState(false);

  const fetchServiceTypes = useCallback(async () => {
    if (!store) return;
    setStLoading(true);
    try {
      const types = await listServiceTypes(store.id);
      setStItems(types);
    } catch {
      // ignore
    } finally {
      setStLoading(false);
    }
  }, [store]);

  const fetchData = useCallback(async () => {
    if (!store) return;
    setFetching(true);
    try {
      const storeData = await getStore(store.id);
      setAllowJumpCall(storeData.allowJumpCall ?? false);
      setAllowNoShow(storeData.allowNoShow ?? false);
    } catch {
      // ignore — store info already available from prop
      setAllowJumpCall(store.allowJumpCall ?? false);
      setAllowNoShow(store.allowNoShow ?? false);
    }
    try {
      const s = await getStoreSettings(store.id);
      setMaxQueueSize(String(s.maxQueueSize));
      setGracePeriodSec(String(s.gracePeriodSec));
      setNoShowAction(s.noShowAction === "REQUEUE" ? "REQUEUE" : "SKIP");
      setMaxRequeues(String(s.maxRequeues));
      setRequeueOffset(String(s.requeueOffset));
      setAlertThreshold(String(s.alertThreshold));
    } catch {
      // defaults already set
    }
    setFetching(false);
  }, [store]);

  useEffect(() => {
    if (open && store) {
      void fetchData();
      void fetchServiceTypes();
    }
  }, [open, store, fetchData, fetchServiceTypes]);

  async function handleToggle(
    field: "allowJumpCall" | "allowNoShow",
    checked: boolean,
  ) {
    if (!store) return;
    setToggleLoading(field);
    try {
      await updateStore(store.id, { [field]: checked });
      if (field === "allowJumpCall") setAllowJumpCall(checked);
      else setAllowNoShow(checked);
      toast.success(tSettings("store.saved"));
      onSuccess();
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(
        apiErr?.code
          ? translateCommonApiError(apiErr, tErrors)
          : translateNetworkError(tErrors),
      );
    } finally {
      setToggleLoading(null);
    }
  }

  async function handleSaveLimits() {
    if (!store) return;
    setSavingLimits(true);
    try {
      await updateStoreSettings(store.id, {
        maxQueueSize: Number(maxQueueSize) || 0,
        alertThreshold: Number(alertThreshold) || 2,
      });
      toast.success(tSettings("store.saved"));
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(
        apiErr?.code
          ? translateCommonApiError(apiErr, tErrors)
          : translateNetworkError(tErrors),
      );
    } finally {
      setSavingLimits(false);
    }
  }

  async function handleSaveNoShow() {
    if (!store) return;
    setSavingNoShow(true);
    try {
      await updateStoreSettings(store.id, {
        gracePeriodSec: Number(gracePeriodSec) || 0,
        noShowAction,
        maxRequeues: Number(maxRequeues) || 1,
        requeueOffset: Number(requeueOffset) || 3,
      });
      toast.success(tSettings("store.saved"));
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(
        apiErr?.code
          ? translateCommonApiError(apiErr, tErrors)
          : translateNetworkError(tErrors),
      );
    } finally {
      setSavingNoShow(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl gap-5 overflow-y-auto px-5 py-6 s:px-7 s:py-7">
        <DialogHeader className="pr-8">
          <DialogTitle>
            {store
              ? tStores("settingsDialogTitle", { storeName: store.name })
              : ""}
          </DialogTitle>
        </DialogHeader>

        {fetching ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Service Types */}
            <Card className="glass-card glass-context-primary">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle>{tStores("serviceTypes")}</CardTitle>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setStEditTarget(null);
                    setStFormOpen(true);
                  }}
                >
                  <Plus className="mr-1.5 size-4" />
                  {tStores("addServiceType")}
                </Button>
              </CardHeader>
              <CardContent>
                <ServiceTypesTable
                  items={stItems}
                  loading={stLoading}
                  onCreate={() => {
                    setStEditTarget(null);
                    setStFormOpen(true);
                  }}
                  onEdit={(st) => {
                    setStEditTarget(st);
                    setStFormOpen(true);
                  }}
                  onDelete={(st) => {
                    setStDeleteTarget(st);
                    setStDeleteOpen(true);
                  }}
                  onToggleActive={(st) => {
                    void (async () => {
                      const storeId = store?.id;
                      if (!storeId) return;

                      try {
                        const updated = await updateServiceType(
                          storeId,
                          st.id,
                          { isActive: !st.isActive },
                        );
                        setStItems((prev) =>
                          prev.map((item) =>
                            item.id === updated.id ? updated : item,
                          ),
                        );
                        toast.success(tStores("serviceTypeUpdated"));
                      } catch (err) {
                        const apiErr = err as ApiError;
                        toast.error(
                          apiErr?.code
                            ? translateCommonApiError(apiErr, tErrors)
                            : translateNetworkError(tErrors),
                        );
                      }
                    })();
                  }}
                />
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
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label>{tSettings("store.allowJumpCallLabel")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {tSettings("store.allowJumpCallCaption")}
                    </p>
                  </div>
                  <Switch
                    checked={allowJumpCall}
                    onCheckedChange={(checked) =>
                      handleToggle("allowJumpCall", checked)
                    }
                    disabled={toggleLoading === "allowJumpCall"}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label>{tSettings("store.allowNoShowLabel")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {tSettings("store.allowNoShowCaption")}
                    </p>
                  </div>
                  <Switch
                    checked={allowNoShow}
                    onCheckedChange={(checked) =>
                      handleToggle("allowNoShow", checked)
                    }
                    disabled={toggleLoading === "allowNoShow"}
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
                  <Label htmlFor="ss-maxQueueSize">
                    {tSettings("store.maxQueueSizeLabel")}
                  </Label>
                  <Input
                    id="ss-maxQueueSize"
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
                  <Label htmlFor="ss-alertThreshold">
                    {tSettings("store.alertThresholdLabel")}
                  </Label>
                  <Input
                    id="ss-alertThreshold"
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
                  disabled={savingLimits}
                  size="sm"
                >
                  {savingLimits && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {tSettings("store.saveButton")}
                </Button>
              </CardContent>
            </Card>

            {/* No-Show Handling */}
            {allowNoShow && (
              <Card className="glass-card glass-context-primary">
                <CardHeader>
                  <CardTitle>{tSettings("store.noShowHandling")}</CardTitle>
                  <CardDescription>
                    {tSettings("store.noShowHandlingDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ss-gracePeriodSec">
                      {tSettings("store.gracePeriodLabel")}
                    </Label>
                    <Input
                      id="ss-gracePeriodSec"
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
                    <Select
                      value={noShowAction}
                      onValueChange={(value) => {
                        if (value) {
                          setNoShowAction(
                            value === "REQUEUE" ? "REQUEUE" : "SKIP",
                          );
                        }
                      }}
                    >
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue>
                          {(value: string | null) => {
                            if (value === "SKIP")
                              return tSettings("store.noShowSkip");
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
                        <Label htmlFor="ss-maxRequeues">
                          {tSettings("store.maxRequeuesLabel")}
                        </Label>
                        <Input
                          id="ss-maxRequeues"
                          type="number"
                          min={1}
                          max={5}
                          value={maxRequeues}
                          onChange={(e) => setMaxRequeues(e.target.value)}
                          className="max-w-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ss-requeueOffset">
                          {tSettings("store.requeueOffsetLabel")}
                        </Label>
                        <Input
                          id="ss-requeueOffset"
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
                    disabled={savingNoShow}
                    size="sm"
                  >
                    {savingNoShow && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    {tSettings("store.saveButton")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        {store && (
          <>
            <ServiceTypeFormDialog
              open={stFormOpen}
              onOpenChange={setStFormOpen}
              serviceType={stEditTarget}
              storeId={store.id}
              onSuccess={() => void fetchServiceTypes()}
            />
            <DeleteServiceTypeDialog
              open={stDeleteOpen}
              onOpenChange={setStDeleteOpen}
              serviceType={stDeleteTarget}
              storeId={store.id}
              onSuccess={() => void fetchServiceTypes()}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
