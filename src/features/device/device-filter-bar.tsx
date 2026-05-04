"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { DeviceKind, DeviceStatus } from "@/types/device";
import type { StoreDto } from "@/types/store";

interface DeviceFilterBarProps {
  statusFilter: string;
  kindFilter: string;
  hardwareFilter: string;
  storeFilter: string;
  stores: StoreDto[];
  isSuperAdmin: boolean;
  onStatusChange: (v: string) => void;
  onKindChange: (v: string) => void;
  onHardwareChange: (v: string) => void;
  onStoreChange: (v: string) => void;
}

const STATUS_OPTIONS = [
  "all",
  "PENDING",
  "PENDING_RF_CODE",
  "ACTIVE",
  "SUSPENDED",
  "DECOMMISSIONED",
  "REJECTED",
] as const;

const KIND_OPTIONS = [
  "all",
  "RECEIVER_433M",
  "RECEIVER_433M_PASSIVE",
  "RECEIVER_2_4G",
  "TRANSMITTER_HUB",
] as const;

const HARDWARE_OPTIONS = ["all", "ESP-01", "ESP32-C3", "PT2272"] as const;

export function DeviceFilterBar({
  statusFilter,
  kindFilter,
  hardwareFilter,
  storeFilter,
  stores,
  isSuperAdmin,
  onStatusChange,
  onKindChange,
  onHardwareChange,
  onStoreChange,
}: DeviceFilterBarProps) {
  const tDevices = useTranslations("devices");

  function getStatusLabel(value: string) {
    if (value === "all") return tDevices("filterStatus");
    return tDevices(`status.${value as DeviceStatus}`);
  }

  function getKindLabel(value: string) {
    if (value === "all") return tDevices("filterKind");
    return tDevices(`kind.${value as DeviceKind}`);
  }

  function getHardwareLabel(value: string) {
    if (value === "all") return tDevices("filterHardware");
    return value;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 s:gap-3">
      <Select value={statusFilter} onValueChange={(v) => v && onStatusChange(v)}>
        <SelectTrigger className="h-9 w-full gap-2 px-3 text-sm s:w-36">
          <span className="truncate">{getStatusLabel(statusFilter)}</span>
        </SelectTrigger>
        <SelectContent
          align="start"
          alignItemWithTrigger={false}
          className="p-1.5"
        >
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt} className="py-2">
              {getStatusLabel(opt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={kindFilter} onValueChange={(v) => v && onKindChange(v)}>
        <SelectTrigger className="h-9 w-full gap-2 px-3 text-sm s:w-40">
          <span className="truncate">{getKindLabel(kindFilter)}</span>
        </SelectTrigger>
        <SelectContent
          align="start"
          alignItemWithTrigger={false}
          className="p-1.5"
        >
          {KIND_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt} className="py-2">
              {getKindLabel(opt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={hardwareFilter} onValueChange={(v) => v && onHardwareChange(v)}>
        <SelectTrigger className="h-9 w-full gap-2 px-3 text-sm s:w-36">
          <span className="truncate">{getHardwareLabel(hardwareFilter)}</span>
        </SelectTrigger>
        <SelectContent
          align="start"
          alignItemWithTrigger={false}
          className="p-1.5"
        >
          {HARDWARE_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt} className="py-2">
              {getHardwareLabel(opt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isSuperAdmin && (
        <Select value={storeFilter} onValueChange={(v) => v && onStoreChange(v)}>
          <SelectTrigger className="h-9 w-full gap-2 px-3 text-sm s:w-40">
            <span className="truncate">
              {storeFilter === "all"
                ? tDevices("filterStore")
                : (stores.find((s) => s.id === storeFilter)?.name ??
                  storeFilter)}
            </span>
          </SelectTrigger>
          <SelectContent
            align="start"
            alignItemWithTrigger={false}
            className="p-1.5"
          >
            <SelectItem value="all" className="py-2">
              {tDevices("filterStore")}
            </SelectItem>
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id} className="py-2">
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
