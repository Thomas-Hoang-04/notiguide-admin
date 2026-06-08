"use client";

import { Copy, Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface JoinCodePanelProps {
  fetchCode: () => Promise<{ joinCode: string }>;
  rotateCode: () => Promise<{ joinCode: string }>;
}

export function JoinCodePanel({ fetchCode, rotateCode }: JoinCodePanelProps) {
  const tAdmins = useTranslations("admins");
  const tCommon = useTranslations("common");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetchCode()
      .then((r) => setCode(r.joinCode))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchCode]);

  async function copy() {
    await navigator.clipboard.writeText(code);
    toast.success(tAdmins("joinCodeCopied"));
  }

  async function rotate() {
    setRotating(true);
    try {
      setCode((await rotateCode()).joinCode);
    } finally {
      setRotating(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">{tAdmins("joinCodeTitle")}</h2>
      <p className="mt-1 mb-3 text-sm text-muted-foreground">
        {tAdmins("joinCodeDesc")}
      </p>
      <div className="flex gap-2">
        <Input readOnly value={loading ? "…" : code} className="font-mono" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={copy}
          aria-label={tAdmins("joinCodeCopy")}
        >
          <Copy className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setConfirmOpen(true)}
          aria-label={tAdmins("joinCodeRotate")}
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(next) => !rotating && setConfirmOpen(next)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tAdmins("joinCodeRotate")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tAdmins("joinCodeRotateConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rotating}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={rotating}
              onClick={(e) => {
                e.preventDefault();
                void rotate();
              }}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              {rotating && <Loader2 className="mr-2 size-4 animate-spin" />}
              {tAdmins("joinCodeRotate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
