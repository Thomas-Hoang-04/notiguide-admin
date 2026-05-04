"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import type { DeviceDto } from "@/types/device";
import { DeviceStatusBadge } from "./device-status-badge";

interface DeviceListTableProps {
  devices: DeviceDto[] | null;
  loading: boolean;
}

export function DeviceListTable({ devices, loading }: DeviceListTableProps) {
  const format = useFormatter();
  const tCommon = useTranslations("common");
  const tDevices = useTranslations("devices");

  return (
    <div className="glass-card glass-card-hover glass-context-primary rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm xl:min-w-0">
          <thead>
            <tr className="border-b border-border">
              <th
                scope="col"
                className="px-4 py-3 font-medium text-muted-foreground"
              >
                {tDevices("columnName")}
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-medium text-muted-foreground"
              >
                {tDevices("columnKind")}
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 font-medium text-muted-foreground s:table-cell"
              >
                {tDevices("columnHardware")}
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-medium text-muted-foreground"
              >
                {tDevices("columnStatus")}
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 font-medium text-muted-foreground xl:table-cell"
              >
                {tDevices("columnStore")}
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 font-medium text-muted-foreground xl:table-cell"
              >
                {tDevices("columnCreated")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              !devices &&
              ["a", "b", "c", "d", "e"].map((id) => (
                <tr key={`skeleton-${id}`} className="border-b border-border">
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </td>
                  <td className="hidden px-4 py-3 s:table-cell">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </td>
                  <td className="hidden px-4 py-3 xl:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="hidden px-4 py-3 xl:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </td>
                </tr>
              ))}

            {!loading && devices && devices.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {tDevices("emptyState")}
                </td>
              </tr>
            )}

            {devices?.map((device) => (
              <tr
                key={device.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/dashboard/devices/${device.id}`}
                    className="text-primary hover:underline"
                  >
                    {device.assignedName ||
                      device.publicId ||
                      tCommon("unknown")}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="border-border">
                    {tDevices(`kind.${device.kind}`)}
                  </Badge>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground s:table-cell">
                  {device.hardwareModel}
                </td>
                <td className="px-4 py-3">
                  <DeviceStatusBadge status={device.status} />
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                  {device.storeName || tCommon("none")}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                  {device.createdAt
                    ? format.dateTime(new Date(device.createdAt), {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                      })
                    : tCommon("unknown")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
