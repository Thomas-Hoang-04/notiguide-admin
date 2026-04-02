"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type SyntheticEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { ApiError } from "@/types/api";
import type { StoreDto, UpdateStoreRequest } from "@/types/store";
import { createStore, updateStore } from "./api";
import {
  buildStoreUpdateRequest,
  mapStoreGeneralApiErrors,
  type StoreGeneralFieldErrors,
  StoreGeneralFields,
  validateStoreGeneralFields,
} from "./store-general-fields";
import type { NoShowAction } from "./store-queue-settings-fields";
import {
  StoreNoShowHandlingCard,
  StoreQueueBehaviorCard,
  StoreQueueLimitsCard,
} from "./store-queue-settings-fields";

interface StoreFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store?: StoreDto | null;
  onSuccess: () => void;
}

type StoreFormErrors = StoreGeneralFieldErrors & {
  alertThreshold?: string;
  gracePeriodSec?: string;
  maxQueueSize?: string;
  maxRequeues?: string;
  requeueOffset?: string;
};

type StoreNumericErrorField =
  | "alertThreshold"
  | "gracePeriodSec"
  | "maxQueueSize"
  | "maxRequeues"
  | "requeueOffset";

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
  const [errors, setErrors] = useState<StoreFormErrors>({});

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
    field: StoreNumericErrorField,
    options: { max?: number; min: number },
    errs: StoreFormErrors,
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
    const errs: StoreFormErrors = validateStoreGeneralFields(
      { address, name },
      tValidation,
    );

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

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit && store) {
        const request: UpdateStoreRequest = buildStoreUpdateRequest({
          address,
          isActive,
          name,
          store,
        });

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
          const nextErrors: StoreFormErrors = {
            ...mapStoreGeneralApiErrors(err.details, tValidation),
          };

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
      <DialogContent
        className={cn(
          "max-h-[90vh] gap-6 overflow-y-auto px-5 py-6 s:px-7 s:py-7",
          isEdit ? "xs:max-w-3xl" : "xs:max-w-4xl",
        )}
      >
        <DialogHeader className="pr-8">
          <DialogTitle>
            {isEdit ? tStores("editTitle") : tStores("createTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <StoreGeneralFields
            idPrefix="store"
            name={name}
            onNameChange={setName}
            address={address}
            onAddressChange={setAddress}
            addressRows={3}
            errors={errors}
            activeToggle={
              isEdit
                ? {
                    checked: isActive,
                    disabled: loading,
                    onCheckedChange: setIsActive,
                  }
                : undefined
            }
          />

          {!isEdit && (
            <>
              <StoreQueueBehaviorCard
                allowJumpCall={allowJumpCall}
                allowJumpCallDisabled={loading}
                allowNoShow={allowNoShow}
                allowNoShowDisabled={loading}
                onAllowJumpCallChange={setAllowJumpCall}
                onAllowNoShowChange={setAllowNoShow}
              />

              <StoreQueueLimitsCard
                maxQueueSizeId="maxQueueSize"
                maxQueueSize={maxQueueSize}
                onMaxQueueSizeChange={setMaxQueueSize}
                maxQueueSizeError={errors.maxQueueSize}
                alertThresholdId="alertThreshold"
                alertThreshold={alertThreshold}
                onAlertThresholdChange={setAlertThreshold}
                alertThresholdError={errors.alertThreshold}
                inputWidthClassName="max-w-sm"
              />

              <StoreNoShowHandlingCard
                visible={allowNoShow}
                gracePeriodId="gracePeriodSec"
                gracePeriodSec={gracePeriodSec}
                onGracePeriodSecChange={setGracePeriodSec}
                noShowAction={noShowAction}
                onNoShowActionChange={setNoShowAction}
                maxRequeuesId="maxRequeues"
                maxRequeues={maxRequeues}
                onMaxRequeuesChange={setMaxRequeues}
                requeueOffsetId="requeueOffset"
                requeueOffset={requeueOffset}
                onRequeueOffsetChange={setRequeueOffset}
                inputWidthClassName="max-w-sm"
                errors={{
                  gracePeriodSec: errors.gracePeriodSec,
                  maxRequeues: errors.maxRequeues,
                  requeueOffset: errors.requeueOffset,
                }}
              />
            </>
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
