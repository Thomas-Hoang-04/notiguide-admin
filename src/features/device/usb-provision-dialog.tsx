"use client";

import { Check, Eye, EyeOff, Loader2, Usb, Wifi, WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { listStores } from "@/features/store/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import type { TestWifiResult } from "@/lib/serial/types";
import { isReceiverKind } from "@/lib/serial/types";
import { useSerial } from "@/lib/serial/use-serial";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/types/api";
import type { StoreDto } from "@/types/store";
import {
  approveDevice,
  getDevice,
  issueEnrollmentToken,
  listDevices,
} from "./api";
import { SerialConsole } from "./serial-console";
import { StoreSelectField } from "./store-select-field";

type ProvisionStep =
  | "connect"
  | "form"
  | "testing_wifi"
  | "issuing_token"
  | "provisioning"
  | "restarting"
  | "pending"
  | "approving"
  | "done"
  | "error";

interface UsbProvisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const STEPPER_KEYS = [
  "step_token",
  "step_provision",
  "step_restart",
  "step_wifi",
  "step_mqtt",
  "step_pending",
  "step_activated",
] as const;

const STEP_INDEX_MAP: Record<string, number> = {
  connect: -1,
  form: -1,
  testing_wifi: -1,
  issuing_token: 0,
  provisioning: 1,
  restarting: 2,
  pending: 5,
  approving: 5,
  done: 6,
  error: -1,
};

export function UsbProvisionDialog({
  open,
  onOpenChange,
  onSuccess,
}: UsbProvisionDialogProps) {
  const { admin, isSuperAdmin, storeId: adminStoreId } = useAuthStore();
  const tCommon = useTranslations("common");
  const tDevices = useTranslations("devices");
  const tUsb = useTranslations("devices.usb");
  const tErrors = useTranslations("errors");
  const tQueue = useTranslations("queue");

  const {
    canUseSerial,
    portState,
    identifyPayload,
    deviceKind,
    isNativeUsbPort,
    connect,
    reconnectKnownPort,
    disconnect,
    sendCommand,
    deviceState,
    events,
  } = useSerial();

  const [step, setStep] = useState<ProvisionStep>("connect");
  const [stores, setStores] = useState<StoreDto[]>([]);

  const [assignedName, setAssignedName] = useState("");
  const [storeId, setStoreId] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPwd, setWifiPwd] = useState("");
  const [mqttUri, setMqttUri] = useState("");
  const [mqttUser, setMqttUser] = useState("");
  const [mqttPwd, setMqttPwd] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [wifiResult, setWifiResult] = useState<TestWifiResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showWifiPwd, setShowWifiPwd] = useState(false);
  const [showMqttPwd, setShowMqttPwd] = useState(false);

  useEffect(() => {
    if (!open) return;

    setStep("connect");
    setAssignedName("");
    setStoreId(adminStoreId ?? "");
    setWifiSsid("");
    setWifiPwd("");
    setMqttUri("");
    setMqttUser("");
    setMqttPwd("");
    setErrors({});
    setWifiResult(null);
    setErrorMessage("");
    setLoading(false);
    setShowWifiPwd(false);
    setShowMqttPwd(false);

    if (isSuperAdmin) {
      listStores(0, 100)
        .then((res) => setStores(res.items))
        .catch(() => toast.error(tQueue("failedToLoadStores")));
    }
  }, [open, isSuperAdmin, adminStoreId, tQueue]);

  useEffect(() => {
    if (!open && portState === "open") {
      void disconnect();
    }
  }, [open, portState, disconnect]);

  useEffect(() => {
    if (step !== "done") return;
    const timer = setTimeout(() => onOpenChange(false), 5_000);
    return () => clearTimeout(timer);
  }, [step, onOpenChange]);

  useEffect(() => {
    if (!open || step !== "connect" || !identifyPayload) return;
    setStep("form");
  }, [open, step, identifyPayload]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (deviceKind && !isReceiverKind(deviceKind) && !assignedName.trim())
      errs.assignedName = tDevices("pending.approveNameRequired");
    if (!storeId) errs.storeId = tDevices("pending.approveStoreRequired");
    if (!wifiSsid.trim()) errs.wifiSsid = tDevices("usb.wifi_fail");
    if (!mqttUri.trim() || !mqttUri.startsWith("mqtts://"))
      errs.mqttUri = tErrors("badRequest");
    if (!mqttUser.trim()) errs.mqttUser = tErrors("badRequest");
    if (!mqttPwd.trim()) errs.mqttPwd = tErrors("badRequest");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleTestWifi() {
    setWifiResult(null);
    setStep("testing_wifi");
    try {
      const result = await sendCommand("provision.test_wifi", {
        wifi_ssid: wifiSsid,
        wifi_pwd: wifiPwd || undefined,
      });
      setWifiResult(result);
      setStep("form");
    } catch {
      setWifiResult({ connected: false });
      setStep("form");
    }
  }

  async function sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function listPendingDeviceIds(): Promise<Set<string>> {
    const kind =
      deviceKind && isReceiverKind(deviceKind) ? deviceKind : "TRANSMITTER_HUB";
    const result = await listDevices(kind, storeId);
    return new Set(
      result.devices
        .filter((device) => device.status === "PENDING")
        .map((device) => device.id),
    );
  }

  async function waitForRestartReconnect(): Promise<void> {
    if (isNativeUsbPort) {
      for (let attempt = 0; attempt < 20; attempt++) {
        await sleep(2_000);
        try {
          await reconnectKnownPort();
          await sendCommand("ping");
          return;
        } catch {
          // waiting for USB re-enumeration
        }
      }
    } else {
      for (let attempt = 0; attempt < 20; attempt++) {
        await sleep(2_000);
        try {
          await sendCommand("ping");
          return;
        } catch {
          // device still rebooting
        }
      }
    }
  }

  async function handleProvision() {
    if (!validate()) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const existingPendingIds = await listPendingDeviceIds();

      setStep("issuing_token");

      const tokenResult = await issueEnrollmentToken({
        storeId: storeId || null,
      });

      setStep("provisioning");

      await sendCommand("provision", {
        wifi_ssid: wifiSsid,
        wifi_pwd: wifiPwd || undefined,
        mqtt_uri: mqttUri,
        mqtt_user: mqttUser,
        mqtt_pwd: mqttPwd,
        enroll_token: tokenResult.token,
      }).catch((provisionErr: unknown) => {
        const msg = provisionErr instanceof Error ? provisionErr.message : "";
        const isDeviceRestart =
          msg.startsWith("serial_timeout") || msg === "serial_disconnected";
        if (!isDeviceRestart) throw provisionErr;
      });

      setStep("restarting");
      await waitForRestartReconnect();

      await pollForPendingDevice(existingPendingIds);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(translateCommonApiError(err, tErrors));
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(translateNetworkError(tErrors));
      }
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  async function waitForActivation(deviceId: string): Promise<void> {
    for (let attempt = 0; attempt < 15; attempt++) {
      await sleep(2_000);
      try {
        const device = await getDevice(deviceId);
        if (device.status !== "PENDING") return;
      } catch {
        // retry
      }
    }
  }

  async function pollForPendingDevice(existingPendingIds: Set<string>) {
    setStep("pending");

    for (let attempt = 0; attempt < 10; attempt++) {
      await sleep(3_000);
      try {
        const kind =
          deviceKind && isReceiverKind(deviceKind)
            ? deviceKind
            : "TRANSMITTER_HUB";
        const result = await listDevices(kind, storeId);
        const pending = result.devices.filter(
          (d) => d.status === "PENDING" && !existingPendingIds.has(d.id),
        );

        if (pending.length === 1) {
          setStep("approving");
          try {
            await approveDevice(pending[0].id, {
              assignedName:
                deviceKind && isReceiverKind(deviceKind)
                  ? `Receiver ${identifyPayload?.mac.slice(-5).replace(":", "")}`
                  : assignedName.trim(),
              storeId,
            });
            await waitForActivation(pending[0].id);
            setStep("done");
            onSuccess();
            return;
          } catch (err) {
            if (err instanceof ApiError) {
              setErrorMessage(translateCommonApiError(err, tErrors));
            }
            setStep("error");
            return;
          }
        }

        if (pending.length > 1) {
          setErrorMessage(tUsb("pending_ambiguous"));
          setStep("error");
          return;
        }
      } catch {
        // retry
      }
    }

    setErrorMessage(tUsb("pending_ambiguous"));
    setStep("error");
  }

  const activeStepIndex = STEP_INDEX_MAP[step] ?? -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{tUsb("provision_title")}</DialogTitle>
        </DialogHeader>

        {step === "connect" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {tUsb("provision_desc")}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {tCommon("cancel")}
              </Button>
              <Button
                onClick={() => void connect().catch(() => {})}
                className="bg-primary text-primary-foreground hover:bg-primary-hover"
                disabled={!canUseSerial || portState !== "closed"}
              >
                {portState !== "closed" ? (
                  <Loader2
                    aria-hidden="true"
                    className="mr-2 size-4 animate-spin"
                  />
                ) : (
                  <Usb aria-hidden="true" className="mr-2 size-4" />
                )}
                {portState !== "closed" ? tUsb("connecting") : tUsb("connect")}
              </Button>
            </DialogFooter>
          </div>
        )}

        {(step === "form" || step === "testing_wifi") && identifyPayload && (
          <div className="space-y-4">
            <Card className="rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">{tUsb("mac")}</span>
                <span className="font-mono">{identifyPayload.mac}</span>
                <span className="text-muted-foreground">
                  {tUsb("device_type")}
                </span>
                <span>
                  {deviceKind === "TRANSMITTER_HUB"
                    ? tUsb("type_transmitter_hub")
                    : deviceKind === "RECEIVER_433M"
                      ? tUsb("type_receiver_433m")
                      : deviceKind === "RECEIVER_2_4G"
                        ? tUsb("type_receiver_2_4g")
                        : deviceKind}
                </span>
                <span className="text-muted-foreground">
                  {tUsb("firmware")}
                </span>
                <span>{identifyPayload.firmware_version}</span>
                <span className="text-muted-foreground">
                  {tDevices("detail.status")}
                </span>
                <span>{identifyPayload.op_state}</span>
              </div>
            </Card>

            {deviceState?.provisioned && (
              <div className="rounded-xl border border-warning/40 bg-warning/15 p-3 text-sm text-warning dark:border-warning/50 dark:bg-warning/20">
                {tUsb("already_provisioned")}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleProvision();
              }}
              noValidate
              className="space-y-4"
            >
              <StoreSelectField
                label={tUsb("select_store")}
                storeId={storeId}
                onStoreIdChange={setStoreId}
                stores={stores}
                isSuperAdmin={isSuperAdmin}
                adminStoreName={admin?.storeName ?? tCommon("unknown")}
                placeholder={tDevices("pending.approveStorePlaceholder")}
                unknownLabel={tCommon("unknown")}
                error={errors.storeId}
              />

              {deviceKind && !isReceiverKind(deviceKind) && (
                <div className="space-y-2">
                  <Label htmlFor="usb-name">{tUsb("assigned_name")}</Label>
                  <Input
                    id="usb-name"
                    value={assignedName}
                    onChange={(e) => setAssignedName(e.target.value)}
                    maxLength={100}
                    aria-invalid={!!errors.assignedName}
                  />
                  {errors.assignedName && (
                    <InlineError
                      message={errors.assignedName}
                      className="mt-1"
                    />
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="usb-ssid">{tUsb("wifi_ssid")}</Label>
                  <Input
                    id="usb-ssid"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    maxLength={32}
                    aria-invalid={!!errors.wifiSsid}
                  />
                  {errors.wifiSsid && (
                    <InlineError message={errors.wifiSsid} className="mt-1" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usb-wifi-pwd">{tUsb("wifi_password")}</Label>
                  <div className="relative">
                    <Input
                      id="usb-wifi-pwd"
                      type={showWifiPwd ? "text" : "password"}
                      value={wifiPwd}
                      onChange={(e) => setWifiPwd(e.target.value)}
                      maxLength={64}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWifiPwd((v) => !v)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showWifiPwd
                          ? tUsb("hidePassword")
                          : tUsb("showPassword")
                      }
                    >
                      {showWifiPwd ? (
                        <EyeOff aria-hidden="true" className="size-4" />
                      ) : (
                        <Eye aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="usb-mqtt-uri">{tUsb("mqtt_uri")}</Label>
                <Input
                  id="usb-mqtt-uri"
                  value={mqttUri}
                  onChange={(e) => setMqttUri(e.target.value)}
                  maxLength={191}
                  placeholder="mqtts://"
                  aria-invalid={!!errors.mqttUri}
                />
                {errors.mqttUri && (
                  <InlineError message={errors.mqttUri} className="mt-1" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="usb-mqtt-user">{tUsb("mqtt_username")}</Label>
                  <Input
                    id="usb-mqtt-user"
                    value={mqttUser}
                    onChange={(e) => setMqttUser(e.target.value)}
                    maxLength={95}
                    aria-invalid={!!errors.mqttUser}
                  />
                  {errors.mqttUser && (
                    <InlineError message={errors.mqttUser} className="mt-1" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usb-mqtt-pwd">{tUsb("mqtt_password")}</Label>
                  <div className="relative">
                    <Input
                      id="usb-mqtt-pwd"
                      type={showMqttPwd ? "text" : "password"}
                      value={mqttPwd}
                      onChange={(e) => setMqttPwd(e.target.value)}
                      maxLength={127}
                      aria-invalid={!!errors.mqttPwd}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMqttPwd((v) => !v)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showMqttPwd
                          ? tUsb("hidePassword")
                          : tUsb("showPassword")
                      }
                    >
                      {showMqttPwd ? (
                        <EyeOff aria-hidden="true" className="size-4" />
                      ) : (
                        <Eye aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </div>
                  {errors.mqttPwd && (
                    <InlineError message={errors.mqttPwd} className="mt-1" />
                  )}
                </div>
              </div>

              {wifiResult && (
                <div
                  className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                    wifiResult.connected
                      ? "border border-success/40 bg-success/10 text-success"
                      : "border border-destructive/40 bg-destructive/10 text-destructive"
                  }`}
                >
                  {wifiResult.connected ? (
                    <Wifi aria-hidden="true" className="size-4" />
                  ) : (
                    <WifiOff aria-hidden="true" className="size-4" />
                  )}
                  <span>
                    {wifiResult.connected
                      ? `${tUsb("wifi_ok")} (RSSI: ${wifiResult.rssi}, IP: ${wifiResult.ip})`
                      : tUsb("wifi_fail")}
                  </span>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleTestWifi()}
                  disabled={!wifiSsid.trim() || step === "testing_wifi"}
                >
                  {step === "testing_wifi" ? (
                    <Loader2
                      aria-hidden="true"
                      className="mr-2 size-4 animate-spin"
                    />
                  ) : (
                    <Wifi aria-hidden="true" className="mr-2 size-4" />
                  )}
                  {tUsb("test_wifi")}
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary-hover"
                  disabled={loading || step === "testing_wifi"}
                >
                  {loading && (
                    <Loader2
                      aria-hidden="true"
                      className="mr-2 size-4 animate-spin"
                    />
                  )}
                  {tUsb("provision_title")}
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}

        {(step === "issuing_token" ||
          step === "provisioning" ||
          step === "restarting" ||
          step === "pending" ||
          step === "approving" ||
          step === "done") && (
          <div className="space-y-4">
            <Card className="rounded-lg p-4">
              <div className="flex flex-col gap-2">
                {STEPPER_KEYS.map((key, i) => {
                  const isDone = step === "done";
                  const isActive = !isDone && i === activeStepIndex;
                  const isComplete = isDone || i < activeStepIndex;
                  const isPending = !isDone && i > activeStepIndex;

                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div
                        className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                          isComplete
                            ? "bg-success text-success-foreground"
                            : isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isComplete ? (
                          <Check aria-hidden="true" className="size-3.5" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          isPending ? "text-muted-foreground" : ""
                        }`}
                      >
                        {tUsb(key)}
                      </span>
                      {isActive && (
                        <Loader2
                          aria-hidden="true"
                          className="size-3.5 animate-spin text-primary"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {step === "done" && (
              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {tCommon("close")}
                </Button>
              </DialogFooter>
            )}
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {tCommon("close")}
              </Button>
              <Button
                onClick={() => setStep(identifyPayload ? "form" : "connect")}
                className="bg-primary text-primary-foreground hover:bg-primary-hover"
              >
                {tCommon("retry")}
              </Button>
            </DialogFooter>
          </div>
        )}
        {portState === "open" && (
          <div className="border-t pt-4">
            <SerialConsole events={events} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
