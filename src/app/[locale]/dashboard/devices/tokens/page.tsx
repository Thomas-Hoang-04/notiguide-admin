"use client";

import { Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listEnrollmentTokens } from "@/features/device/api";
import { EnrollmentTokenDialog } from "@/features/device/enrollment-token-dialog";
import { EnrollmentTokenTable } from "@/features/device/enrollment-token-table";
import { listStores } from "@/features/store/api";
import { Link } from "@/i18n/navigation";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/types/api";
import type { EnrollmentTokenMetadataDto } from "@/types/device";
import type { StoreDto } from "@/types/store";

export default function DevicesTokensPage() {
  const { isSuperAdmin } = useAuthStore();
  const tDevices = useTranslations("devices");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tQueue = useTranslations("queue");

  const [tokens, setTokens] = useState<EnrollmentTokenMetadataDto[] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listEnrollmentTokens();
      setTokens(result);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(translateCommonApiError(err, tErrors));
      } else {
        toast.error(translateNetworkError(tErrors));
      }
    } finally {
      setLoading(false);
    }
  }, [tErrors]);

  useEffect(() => {
    void fetchTokens();
    if (isSuperAdmin) {
      listStores(0, 100)
        .then((res) => setStores(res.items))
        .catch(() => toast.error(tQueue("failedToLoadStores")));
    }
  }, [fetchTokens, isSuperAdmin, tQueue]);

  function getStoreName(storeId: string | null): string {
    if (!storeId) return tCommon("none");
    return stores.find((s) => s.id === storeId)?.name || tCommon("unknown");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 s:flex-row s:items-center s:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/devices"
            className="text-sm text-primary hover:underline"
          >
            {tDevices("title")}
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-2xl font-bold">{tDevices("tokensTab")}</h1>
        </div>
        <Button variant="outline" onClick={() => setTokenDialogOpen(true)}>
          <Radio aria-hidden="true" className="mr-2 size-4" />
          {tDevices("tokens.issueAction")}
        </Button>
      </div>

      <EnrollmentTokenTable
        tokens={tokens}
        loading={loading}
        resolveStoreName={getStoreName}
        onRevoked={() => void fetchTokens()}
      />

      <EnrollmentTokenDialog
        open={tokenDialogOpen}
        onOpenChange={setTokenDialogOpen}
        onSuccess={() => void fetchTokens()}
      />
    </div>
  );
}
