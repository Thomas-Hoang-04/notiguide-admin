"use client";

import { Loader2, Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { getAvailableDevices } from "@/features/queue/api";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import type { SerialCommandMap, TransmitResult } from "@/lib/serial/types";
import { ApiError } from "@/types/api";
import type { DeviceDto } from "@/types/device";
import { getUsbDispatchPayload } from "./api";

type DispatchMode = "receiver" | "manual";

interface UsbDispatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  sendCommand: <K extends keyof SerialCommandMap>(
    type: K,
    ...args: SerialCommandMap[K]["payload"] extends undefined
      ? []
      : [payload: SerialCommandMap[K]["payload"]]
  ) => Promise<SerialCommandMap[K]["response"]>;
}

export function UsbDispatchDialog({
  open,
  onOpenChange,
  storeId,
  sendCommand,
}: UsbDispatchDialogProps) {
  const tDevices = useTranslations("devices");
  const tUsb = useTranslations("devices.usb");
  const tQueue = useTranslations("queue");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");

  const [mode, setMode] = useState<DispatchMode>("receiver");
  const [devices, setDevices] = useState<DeviceDto[]>([]);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [action, setAction] = useState<"call" | "stop">("call");

  const [band, setBand] = useState<"433M" | "2_4G">("433M");
  const [rfCodeHex, setRfCodeHex] = useState("");
  const [rfCodeBits, setRfCodeBits] = useState("24");
  const [protoAny, setProtoAny] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && storeId) {
      setSelectedDeviceId("");
      setErrors({});
      setFetching(true);
      getAvailableDevices(storeId)
        .then((res) => setDevices(res.devices))
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [open, storeId]);

  function validateManual(): boolean {
    const errs: Record<string, string> = {};
    const normalizedHex = rfCodeHex.trim();
    if (!/^[0-9a-fA-F]+$/.test(normalizedHex)) {
      errs.rfCodeHex = tUsb("manual_invalid_hex");
    }
    const bits = Number.parseInt(rfCodeBits, 10);
    if (band === "433M") {
      const expectedHexLength = Math.ceil(bits / 8) * 2;
      if (
        Number.isNaN(bits) ||
        bits < 1 ||
        bits > 32 ||
        normalizedHex.length !== expectedHexLength
      ) {
        errs.rfCodeBits = tUsb("manual_width_mismatch");
      }
    } else if (
      Number.isNaN(bits) ||
      bits !== 40 ||
      normalizedHex.length !== 10
    ) {
      errs.rfCodeBits = tUsb("manual_width_mismatch");
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleReceiverDispatch() {
    if (!selectedDeviceId || loading) return;
    const device = devices.find((d) => d.id === selectedDeviceId);
    if (!device) return;
    setLoading(true);
    try {
      let result: TransmitResult;
      if (device.hubSlot != null) {
        // Hub-paired receivers have no backend RF code; the hub resolves
        // the code from its own roster, mirroring slot-based MQTT dispatch.
        result = await sendCommand("transmit_slot", {
          slot: device.hubSlot,
          action,
        });
      } else {
        const payload = await getUsbDispatchPayload({
          storeId,
          deviceId: selectedDeviceId,
          action,
        });

        result = await sendCommand("transmit", {
          receiver_public_id: payload.receiverPublicId,
          band: payload.band,
          rf_code_hex: payload.rfCodeHex,
          rf_code_bits: payload.rfCodeBits,
          proto_any: payload.protoAny,
        });
      }

      if (result.status === "applied") {
        toast.success(tUsb("test_dispatch"));
      } else {
        toast.error(result.reason ?? "rejected");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleManualDispatch() {
    if (loading) return;
    if (!validateManual()) return;
    setLoading(true);
    try {
      const result = await sendCommand("transmit", {
        band,
        rf_code_hex: rfCodeHex.toUpperCase(),
        rf_code_bits: Number.parseInt(rfCodeBits, 10),
        proto_any: protoAny,
      });

      if (result.status === "applied") {
        toast.success(tUsb("test_dispatch"));
      } else {
        toast.error(result.reason ?? "rejected");
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tUsb("test_dispatch")}
            <Badge
              variant="outline"
              className="border-warning/40 bg-warning/10 text-warning"
            >
              USB
            </Badge>
          </DialogTitle>
          <DialogDescription>{tUsb("local_warning")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={mode === "receiver" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("receiver")}
              className={
                mode === "receiver" ? "bg-primary text-primary-foreground" : ""
              }
            >
              <Radio aria-hidden="true" className="mr-1.5 size-3.5" />
              {tUsb("dispatch_receiver")}
            </Button>
            <Button
              variant={mode === "manual" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("manual")}
              className={
                mode === "manual" ? "bg-primary text-primary-foreground" : ""
              }
            >
              {tUsb("dispatch_manual")}
            </Button>
          </div>

          {mode === "receiver" && (
            <div className="space-y-4">
              {fetching ? (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  {tUsb("loading")}
                </div>
              ) : devices.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {tQueue("dispatch.disabledNoDevice")}
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>{tUsb("dispatch_receiver")}</Label>
                    <Select
                      value={selectedDeviceId}
                      onValueChange={(v) => v && setSelectedDeviceId(v)}
                    >
                      <SelectTrigger className="h-10 w-full gap-2 px-3">
                        <span>
                          {selectedDeviceId
                            ? (devices.find((d) => d.id === selectedDeviceId)
                                ?.assignedName ??
                              devices.find((d) => d.id === selectedDeviceId)
                                ?.publicId ??
                              tCommon("unknown"))
                            : tUsb("dispatch_receiver")}
                        </span>
                      </SelectTrigger>
                      <SelectContent
                        align="start"
                        alignItemWithTrigger={false}
                        className="p-1.5"
                      >
                        {devices.map((d) => (
                          <SelectItem key={d.id} value={d.id} className="py-2">
                            <div className="flex items-center gap-2">
                              <Radio aria-hidden="true" className="size-3.5" />
                              <span>{d.assignedName || d.publicId}</span>
                              <span className="text-xs text-muted-foreground">
                                {tDevices(`kind.${d.kind}`)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{tUsb("action")}</Label>
                    <Select
                      value={action}
                      onValueChange={(v) => setAction(v as "call" | "stop")}
                    >
                      <SelectTrigger className="h-10 w-full gap-2 px-3">
                        <span>
                          {action === "call" ? tUsb("call") : tUsb("stop")}
                        </span>
                      </SelectTrigger>
                      <SelectContent
                        align="start"
                        alignItemWithTrigger={false}
                        className="p-1.5"
                      >
                        <SelectItem value="call" className="py-2">
                          {tUsb("call")}
                        </SelectItem>
                        <SelectItem value="stop" className="py-2">
                          {tUsb("stop")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  onClick={() => void handleReceiverDispatch()}
                  disabled={loading || !selectedDeviceId}
                  className="bg-primary text-primary-foreground hover:bg-primary-hover"
                >
                  {loading && (
                    <Loader2
                      aria-hidden="true"
                      className="mr-2 size-4 animate-spin"
                    />
                  )}
                  {tUsb("test_dispatch")}
                </Button>
              </DialogFooter>
            </div>
          )}

          {mode === "manual" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleManualDispatch();
              }}
              noValidate
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{tUsb("band")}</Label>
                  <Select
                    value={band}
                    onValueChange={(v) => setBand(v as "433M" | "2_4G")}
                  >
                    <SelectTrigger className="h-10 w-full gap-2 px-3">
                      <span>{band === "433M" ? "433 MHz" : "2.4GHz"}</span>
                    </SelectTrigger>
                    <SelectContent
                      align="start"
                      alignItemWithTrigger={false}
                      className="p-1.5"
                    >
                      <SelectItem value="433M" className="py-2">
                        433 MHz
                      </SelectItem>
                      <SelectItem value="2_4G" className="py-2">
                        2.4 GHz
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usb-bits">{tUsb("bits")}</Label>
                  <Input
                    id="usb-bits"
                    value={rfCodeBits}
                    onChange={(e) => setRfCodeBits(e.target.value)}
                    type="number"
                    min={1}
                    max={40}
                    aria-invalid={!!errors.rfCodeBits}
                  />
                  {errors.rfCodeBits && (
                    <InlineError message={errors.rfCodeBits} className="mt-1" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="usb-hex">{tUsb("rf_code_hex")}</Label>
                <Input
                  id="usb-hex"
                  value={rfCodeHex}
                  onChange={(e) => setRfCodeHex(e.target.value)}
                  placeholder="ABCD1234"
                  className="font-mono"
                  onBlur={() => setRfCodeHex(rfCodeHex.toUpperCase())}
                  aria-invalid={!!errors.rfCodeHex}
                />
                {errors.rfCodeHex && (
                  <InlineError message={errors.rfCodeHex} className="mt-1" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="usb-proto-any"
                  checked={protoAny}
                  onCheckedChange={setProtoAny}
                />
                <Label htmlFor="usb-proto-any">{tUsb("proto_any")}</Label>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-primary-foreground hover:bg-primary-hover"
                >
                  {loading && (
                    <Loader2
                      aria-hidden="true"
                      className="mr-2 size-4 animate-spin"
                    />
                  )}
                  {tUsb("test_dispatch")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
