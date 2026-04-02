"use client";

import { useTranslations } from "next-intl";
import { InlineError } from "@/components/ui/inline-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { STORE_RULES } from "@/lib/constants";
import type { StoreDto, UpdateStoreRequest } from "@/types/store";

export interface StoreGeneralFieldErrors {
  address?: string;
  name?: string;
}

interface StoreGeneralFieldsProps {
  activeToggle?: {
    checked: boolean;
    disabled?: boolean;
    onCheckedChange: (checked: boolean) => void;
  };
  address: string;
  addressRows?: number;
  errors?: StoreGeneralFieldErrors;
  idPrefix: string;
  name: string;
  onAddressChange: (value: string) => void;
  onNameChange: (value: string) => void;
}

export function buildStoreUpdateRequest({
  address,
  isActive,
  name,
  store,
}: {
  address: string;
  isActive: boolean;
  name: string;
  store: StoreDto;
}): UpdateStoreRequest {
  const request: UpdateStoreRequest = {};

  if (name !== store.name) {
    request.name = name;
  }

  if (address !== (store.address || "")) {
    request.address = address.trim() || null;
  }

  if (isActive !== store.isActive) {
    request.isActive = isActive;
  }

  return request;
}

export function mapStoreGeneralApiErrors(
  details: Record<string, string> | undefined,
  tValidation: ReturnType<typeof useTranslations>,
): StoreGeneralFieldErrors {
  const nextErrors: StoreGeneralFieldErrors = {};

  if (!details) {
    return nextErrors;
  }

  if (details.name) {
    nextErrors.name = details.name.toLowerCase().includes("blank")
      ? tValidation("nameRequired")
      : tValidation("nameMax");
  }

  if (details.address) {
    nextErrors.address = tValidation("addressMax");
  }

  return nextErrors;
}

export function validateStoreGeneralFields(
  {
    address,
    name,
  }: {
    address: string;
    name: string;
  },
  tValidation: ReturnType<typeof useTranslations>,
): StoreGeneralFieldErrors {
  const errors: StoreGeneralFieldErrors = {};

  if (!name.trim()) {
    errors.name = tValidation("nameRequired");
  } else if (name.length > STORE_RULES.NAME_MAX) {
    errors.name = tValidation("nameMax");
  }

  if (address.length > STORE_RULES.ADDRESS_MAX) {
    errors.address = tValidation("addressMax");
  }

  return errors;
}

export function StoreGeneralFields({
  activeToggle,
  address,
  addressRows = 2,
  errors,
  idPrefix,
  name,
  onAddressChange,
  onNameChange,
}: StoreGeneralFieldsProps) {
  const tStores = useTranslations("stores");

  const nameId = `${idPrefix}-name`;
  const addressId = `${idPrefix}-address`;
  const activeId = `${idPrefix}-active`;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={nameId}>{tStores("nameLabel")}</Label>
        <Input
          id={nameId}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={tStores("namePlaceholder")}
          maxLength={STORE_RULES.NAME_MAX}
          aria-invalid={!!errors?.name}
        />
        {errors?.name && <InlineError message={errors.name} className="mt-1" />}
      </div>

      <div className="space-y-2">
        <Label htmlFor={addressId}>{tStores("addressLabel")}</Label>
        <Textarea
          id={addressId}
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder={tStores("addressPlaceholder")}
          rows={addressRows}
          maxLength={STORE_RULES.ADDRESS_MAX}
          aria-invalid={!!errors?.address}
        />
        {errors?.address && (
          <InlineError message={errors.address} className="mt-1" />
        )}
      </div>

      {activeToggle && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
          <div className="space-y-0.5">
            <Label htmlFor={activeId} className="font-medium">
              {tStores("activeLabel")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {tStores("activeHelper")}
            </p>
          </div>
          <Switch
            id={activeId}
            checked={activeToggle.checked}
            onCheckedChange={activeToggle.onCheckedChange}
            disabled={activeToggle.disabled}
          />
        </div>
      )}
    </>
  );
}
