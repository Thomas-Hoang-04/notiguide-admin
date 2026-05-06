"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HubCapBadgeProps {
  registered: number;
  max: number;
}

export function HubCapBadge({ registered, max }: HubCapBadgeProps) {
  const tDevices = useTranslations("devices");

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-xs text-primary"
          >
            {tDevices("hub.capBadge", { registered, max })}
          </Badge>
        }
      />
      <TooltipContent>{tDevices("hub.capTooltip")}</TooltipContent>
    </Tooltip>
  );
}
