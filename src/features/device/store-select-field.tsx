"use client";

import { InlineError } from "@/components/ui/inline-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { StoreDto } from "@/types/store";

interface StoreSelectFieldProps {
  label: string;
  storeId: string;
  onStoreIdChange: (id: string) => void;
  stores: StoreDto[];
  isSuperAdmin: boolean;
  adminStoreName: string;
  placeholder: string;
  unknownLabel: string;
  error?: string;
}

export function StoreSelectField({
  label,
  storeId,
  onStoreIdChange,
  stores,
  isSuperAdmin,
  adminStoreName,
  placeholder,
  unknownLabel,
  error,
}: StoreSelectFieldProps) {
  if (!isSuperAdmin) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input value={adminStoreName} disabled />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={storeId} onValueChange={(v) => v && onStoreIdChange(v)}>
        <SelectTrigger
          className="h-10 w-full gap-2 px-3"
          aria-invalid={!!error}
        >
          <span>
            {storeId
              ? (stores.find((s) => s.id === storeId)?.name ?? unknownLabel)
              : placeholder}
          </span>
        </SelectTrigger>
        <SelectContent
          align="start"
          alignItemWithTrigger={false}
          className="p-1.5"
        >
          {stores.map((s) => (
            <SelectItem key={s.id} value={s.id} className="py-2">
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <InlineError message={error} className="mt-1" />}
    </div>
  );
}
