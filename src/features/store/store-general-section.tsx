"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type SyntheticEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { ApiError } from "@/types/api";
import type { StoreDto } from "@/types/store";
import { updateStore } from "./api";
import {
  buildStoreUpdateRequest,
  mapStoreGeneralApiErrors,
  type StoreGeneralFieldErrors,
  StoreGeneralFields,
  validateStoreGeneralFields,
} from "./store-general-fields";

interface StoreGeneralSectionProps {
  store: StoreDto;
  onSuccess: (store: StoreDto) => void;
}

export function StoreGeneralSection({
  store,
  onSuccess,
}: StoreGeneralSectionProps) {
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tStores = useTranslations("stores");
  const tValidation = useTranslations("validation");

  const [name, setName] = useState(store.name);
  const [address, setAddress] = useState(store.address || "");
  const [isActive, setIsActive] = useState(store.isActive);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<StoreGeneralFieldErrors>({});

  useEffect(() => {
    setName(store.name);
    setAddress(store.address || "");
    setIsActive(store.isActive);
    setErrors({});
  }, [store]);

  function validate(): boolean {
    const nextErrors = validateStoreGeneralFields(
      { address, name },
      tValidation,
    );
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    try {
      const request = buildStoreUpdateRequest({
        address,
        isActive,
        name,
        store,
      });

      if (Object.keys(request).length > 0) {
        const updatedStore = await updateStore(store.id, request);
        toast.success(tStores("updatedToast"));
        onSuccess(updatedStore);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details) {
          const nextErrors = mapStoreGeneralApiErrors(err.details, tValidation);
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
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <StoreGeneralFields
        idPrefix={`gen-${store.id}`}
        name={name}
        onNameChange={setName}
        address={address}
        onAddressChange={setAddress}
        addressRows={2}
        errors={errors}
        activeToggle={{
          checked: isActive,
          disabled: loading,
          onCheckedChange: setIsActive,
        }}
      />

      <Button
        type="submit"
        size="sm"
        disabled={loading}
        className="bg-primary text-primary-foreground hover:bg-primary-hover"
      >
        {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
        {tCommon("save")}
      </Button>
    </form>
  );
}
