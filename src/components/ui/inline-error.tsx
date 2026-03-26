import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type InlineErrorProps = {
  className?: string;
  message: string;
};

export function InlineError({ className, message }: InlineErrorProps) {
  return (
    <p
      role="alert"
      className={cn(
        "flex gap-1.5 text-xs text-destructive align-middle items-center",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
