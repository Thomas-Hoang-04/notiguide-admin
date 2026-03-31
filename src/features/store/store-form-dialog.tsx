"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InlineError } from "@/components/ui/inline-error";
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
import { Textarea } from "@/components/ui/textarea";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { STORE_RULES } from "@/lib/constants";
import { ApiError } from "@/types/api";
import type { StoreDto, UpdateStoreRequest } from "@/types/store";
import { createStore, updateStore } from "./api";

interface StoreFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store?: StoreDto | null;
  onSuccess: () => void;
}

type NoShowAction = "SKIP" | "REQUEUE";

const CREATE_STORE_DEFAULTS: {
  allowJumpCall: boolean;
  allowNoShow: boolean;
  maxQueueSize: string;
  gracePeriodSec: string;
  noShowAction: NoShowAction;
  maxRequeues: string;
  requeueOffset: string;
  alertThreshold: string;
} = {
  allowJumpCall: false,
  allowNoShow: false,
  maxQueueSize: "0",
  gracePeriodSec: "0",
  noShowAction: "SKIP",
  maxRequeues: "1",
  requeueOffset: "3",
  alertThreshold: "2",
};

export function StoreFormDialog({
  open,
  onOpenChange,
  store,
  onSuccess,
}: StoreFormDialogProps) {
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tSettings = useTranslations("settings");
  const tStores = useTranslations("stores");
  const tValidation = useTranslations("validation");
  const isEdit = !!store;

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [allowJumpCall, setAllowJumpCall] = useState(
    CREATE_STORE_DEFAULTS.allowJumpCall,
  );
  const [allowNoShow, setAllowNoShow] = useState(
    CREATE_STORE_DEFAULTS.allowNoShow,
  );
  const [maxQueueSize, setMaxQueueSize] = useState(
    CREATE_STORE_DEFAULTS.maxQueueSize,
  );
  const [gracePeriodSec, setGracePeriodSec] = useState(
    CREATE_STORE_DEFAULTS.gracePeriodSec,
  );
  const [noShowAction, setNoShowAction] = useState(
    CREATE_STORE_DEFAULTS.noShowAction,
  );
  const [maxRequeues, setMaxRequeues] = useState(
    CREATE_STORE_DEFAULTS.maxRequeues,
  );
  const [requeueOffset, setRequeueOffset] = useState(
    CREATE_STORE_DEFAULTS.requeueOffset,
  );
  const [alertThreshold, setAlertThreshold] = useState(
    CREATE_STORE_DEFAULTS.alertThreshold,
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (store) {
        setName(store.name);
        setAddress(store.address || "");
        setIsActive(store.isActive);
      } else {
        setName("");
        setAddress("");
        setIsActive(true);
        setAllowJumpCall(CREATE_STORE_DEFAULTS.allowJumpCall);
        setAllowNoShow(CREATE_STORE_DEFAULTS.allowNoShow);
        setMaxQueueSize(CREATE_STORE_DEFAULTS.maxQueueSize);
        setGracePeriodSec(CREATE_STORE_DEFAULTS.gracePeriodSec);
        setNoShowAction(CREATE_STORE_DEFAULTS.noShowAction);
        setMaxRequeues(CREATE_STORE_DEFAULTS.maxRequeues);
        setRequeueOffset(CREATE_STORE_DEFAULTS.requeueOffset);
        setAlertThreshold(CREATE_STORE_DEFAULTS.alertThreshold);
      }
      setErrors({});
    }
  }, [open, store]);

  function validateOptionalNumber(
    value: string,
    field: string,
    options: { max?: number; min: number },
    errs: Record<string, string>,
  ) {
    if (!value.trim()) return;

    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      errs[field] =
        options.max === undefined
          ? tValidation("nonNegative")
          : tValidation("range", {
              min: options.min,
              max: options.max,
            });
      return;
    }

    if (parsed < options.min) {
      errs[field] =
        options.max === undefined
          ? tValidation("nonNegative")
          : tValidation("range", {
              min: options.min,
              max: options.max,
            });
      return;
    }

    if (options.max !== undefined && parsed > options.max) {
      errs[field] = tValidation("range", {
        min: options.min,
        max: options.max,
      });
    }
  }

  function parseNumberOrDefault(value: string, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = tValidation("nameRequired");
    } else if (name.length > STORE_RULES.NAME_MAX) {
      errs.name = tValidation("nameMax");
    }
    if (address.length > STORE_RULES.ADDRESS_MAX) {
      errs.address = tValidation("addressMax");
    }

    if (!isEdit) {
      validateOptionalNumber(maxQueueSize, "maxQueueSize", { min: 0 }, errs);
      validateOptionalNumber(
        alertThreshold,
        "alertThreshold",
        { min: 1, max: 10 },
        errs,
      );

      if (allowNoShow) {
        validateOptionalNumber(
          gracePeriodSec,
          "gracePeriodSec",
          { min: 0, max: 600 },
          errs,
        );

        if (noShowAction === "REQUEUE") {
          validateOptionalNumber(
            maxRequeues,
            "maxRequeues",
            { min: 1, max: 5 },
            errs,
          );
          validateOptionalNumber(
            requeueOffset,
            "requeueOffset",
            { min: 1, max: 20 },
            errs,
          );
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit && store) {
        const request: UpdateStoreRequest = {};
        if (name !== store.name) request.name = name;
        if (address !== (store.address || "")) {
          request.address = address.trim() || null;
        }
        if (isActive !== store.isActive) request.isActive = isActive;

        if (Object.keys(request).length > 0) {
          await updateStore(store.id, request);
        }
        toast.success(tStores("updatedToast"));
      } else {
        await createStore({
          name,
          ...(address.trim() ? { address: address.trim() } : {}),
          allowJumpCall,
          allowNoShow,
          maxQueueSize: parseNumberOrDefault(maxQueueSize, 0),
          gracePeriodSec: parseNumberOrDefault(gracePeriodSec, 0),
          noShowAction,
          maxRequeues: parseNumberOrDefault(maxRequeues, 1),
          requeueOffset: parseNumberOrDefault(requeueOffset, 3),
          alertThreshold: parseNumberOrDefault(alertThreshold, 2),
        });
        toast.success(tStores("createdToast"));
      }
      onOpenChange(false);
      void onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details) {
          const nextErrors: Record<string, string> = {};

          if (err.details.name) {
            nextErrors.name = err.details.name.toLowerCase().includes("blank")
              ? tValidation("nameRequired")
              : tValidation("nameMax");
          }

          if (err.details.address) {
            nextErrors.address = tValidation("addressMax");
          }

          if (err.details.maxQueueSize) {
            nextErrors.maxQueueSize = tValidation("nonNegative");
          }

          if (err.details.gracePeriodSec) {
            nextErrors.gracePeriodSec = tValidation("range", {
              min: 0,
              max: 600,
            });
          }

          if (err.details.alertThreshold) {
            nextErrors.alertThreshold = tValidation("range", {
              min: 1,
              max: 10,
            });
          }

          if (err.details.maxRequeues) {
            nextErrors.maxRequeues = tValidation("range", {
              min: 1,
              max: 5,
            });
          }

          if (err.details.requeueOffset) {
            nextErrors.requeueOffset = tValidation("range", {
              min: 1,
              max: 20,
            });
          }

          if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
          } else {
            toast.error(translateCommonApiError(err, tErrors));
          }
        } else {
          toast.error(translateCommonApiError(err, tErrors));
        }
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl gap-6 overflow-y-auto px-5 py-6 s:px-7 s:py-7">
        <DialogHeader className="pr-8">
          <DialogTitle>
            {isEdit ? tStores("editTitle") : tStores("createTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="space-y-2.5">
            <Label htmlFor="store-name">{tStores("nameLabel")}</Label>
            <Input
              id="store-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tStores("namePlaceholder")}
              maxLength={STORE_RULES.NAME_MAX}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <InlineError message={errors.name} className="mt-1" />
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="store-address">{tStores("addressLabel")}</Label>
            <Textarea
              id="store-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={tStores("addressPlaceholder")}
              rows={3}
              maxLength={STORE_RULES.ADDRESS_MAX}
              aria-invalid={!!errors.address}
            />
            {errors.address && (
              <InlineError message={errors.address} className="mt-1" />
            )}
          </div>

          {!isEdit && (
            <>
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
                      onCheckedChange={(checked) => setAllowJumpCall(checked)}
                      disabled={loading}
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
                      onCheckedChange={(checked) => setAllowNoShow(checked)}
                      disabled={loading}
                    />
                  </div>
                </CardContent>
              </Card>

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
                      className="max-w-sm"
                      aria-invalid={!!errors.maxQueueSize}
                    />
                    <p className="text-xs text-muted-foreground">
                      {tSettings("store.maxQueueSizeCaption")}
                    </p>
                    {errors.maxQueueSize && (
                      <InlineError message={errors.maxQueueSize} />
                    )}
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
                      className="max-w-sm"
                      aria-invalid={!!errors.alertThreshold}
                    />
                    <p className="text-xs text-muted-foreground">
                      {tSettings("store.alertThresholdCaption")}
                    </p>
                    {errors.alertThreshold && (
                      <InlineError message={errors.alertThreshold} />
                    )}
                  </div>
                </CardContent>
              </Card>

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
                        className="max-w-sm"
                        aria-invalid={!!errors.gracePeriodSec}
                      />
                      <p className="text-xs text-muted-foreground">
                        {tSettings("store.gracePeriodCaption")}
                      </p>
                      {errors.gracePeriodSec && (
                        <InlineError message={errors.gracePeriodSec} />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>{tSettings("store.noShowActionLabel")}</Label>
                      <Select
                        value={noShowAction}
                        onValueChange={(value) => {
                          if (value) {
                            setNoShowAction(value);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full max-w-sm">
                          <SelectValue>
                            {(value: string | null) => {
                              if (value === "SKIP") {
                                return tSettings("store.noShowSkip");
                              }
                              if (value === "REQUEUE") {
                                return tSettings("store.noShowRequeue");
                              }
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
                            className="max-w-sm"
                            aria-invalid={!!errors.maxRequeues}
                          />
                          {errors.maxRequeues && (
                            <InlineError message={errors.maxRequeues} />
                          )}
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
                            className="max-w-sm"
                            aria-invalid={!!errors.requeueOffset}
                          />
                          <p className="text-xs text-muted-foreground">
                            {tSettings("store.requeueOffsetCaption")}
                          </p>
                          {errors.requeueOffset && (
                            <InlineError message={errors.requeueOffset} />
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {isEdit && (
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 s:p-5">
              <div className="space-y-1">
                <Label htmlFor="store-active" className="font-medium">
                  {tStores("activeLabel")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {tStores("activeHelper")}
                </p>
              </div>
              <Switch
                id="store-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          )}

          <DialogFooter className="mt-2 -mx-5 -mb-6 px-5 py-5 s:-mx-7 s:-mb-7 s:px-7 s:py-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? tCommon("save") : tCommon("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
