"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InlineError } from "@/components/ui/inline-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type NoShowAction = "SKIP" | "REQUEUE";

interface StoreQueueBehaviorCardProps {
  allowJumpCall: boolean;
  allowJumpCallDisabled?: boolean;
  allowNoShow: boolean;
  allowNoShowDisabled?: boolean;
  onAllowJumpCallChange: (checked: boolean) => void;
  onAllowNoShowChange: (checked: boolean) => void;
}

interface StoreQueueLimitsCardProps {
  alertThreshold: string;
  alertThresholdError?: string;
  alertThresholdId: string;
  footerAction?: ReactNode;
  inputWidthClassName?: string;
  maxQueueSize: string;
  maxQueueSizeError?: string;
  maxQueueSizeId: string;
  onAlertThresholdChange: (value: string) => void;
  onMaxQueueSizeChange: (value: string) => void;
}

interface StoreNoShowHandlingCardProps {
  errors?: {
    gracePeriodSec?: string;
    maxRequeues?: string;
    requeueOffset?: string;
  };
  footerAction?: ReactNode;
  gracePeriodId: string;
  gracePeriodSec: string;
  inputWidthClassName?: string;
  maxRequeues: string;
  maxRequeuesId: string;
  noShowAction: NoShowAction;
  onGracePeriodSecChange: (value: string) => void;
  onMaxRequeuesChange: (value: string) => void;
  onNoShowActionChange: (value: NoShowAction) => void;
  onRequeueOffsetChange: (value: string) => void;
  requeueOffset: string;
  requeueOffsetId: string;
  visible: boolean;
}

function StoreQueueNumberField({
  caption,
  error,
  id,
  inputWidthClassName = "max-w-xs",
  label,
  max,
  min,
  onChange,
  value,
}: {
  caption?: string;
  error?: string;
  id: string;
  inputWidthClassName?: string;
  label: string;
  max?: number;
  min: number;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputWidthClassName}
        aria-invalid={!!error}
      />
      {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
      {error && <InlineError message={error} />}
    </div>
  );
}

export function StoreQueueBehaviorCard({
  allowJumpCall,
  allowJumpCallDisabled,
  allowNoShow,
  allowNoShowDisabled,
  onAllowJumpCallChange,
  onAllowNoShowChange,
}: StoreQueueBehaviorCardProps) {
  const tSettings = useTranslations("settings");

  return (
    <Card className="glass-card glass-context-primary">
      <CardHeader>
        <CardTitle>{tSettings("store.queueBehavior")}</CardTitle>
        <CardDescription>
          {tSettings("store.queueBehaviorDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label>{tSettings("store.allowJumpCallLabel")}</Label>
            <p className="text-xs text-muted-foreground">
              {tSettings("store.allowJumpCallCaption")}
            </p>
          </div>
          <Switch
            checked={allowJumpCall}
            onCheckedChange={onAllowJumpCallChange}
            disabled={allowJumpCallDisabled}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label>{tSettings("store.allowNoShowLabel")}</Label>
            <p className="text-xs text-muted-foreground">
              {tSettings("store.allowNoShowCaption")}
            </p>
          </div>
          <Switch
            checked={allowNoShow}
            onCheckedChange={onAllowNoShowChange}
            disabled={allowNoShowDisabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function StoreQueueLimitsCard({
  alertThreshold,
  alertThresholdError,
  alertThresholdId,
  footerAction,
  inputWidthClassName,
  maxQueueSize,
  maxQueueSizeError,
  maxQueueSizeId,
  onAlertThresholdChange,
  onMaxQueueSizeChange,
}: StoreQueueLimitsCardProps) {
  const tSettings = useTranslations("settings");

  return (
    <Card className="glass-card glass-context-primary">
      <CardHeader>
        <CardTitle>{tSettings("store.queueLimits")}</CardTitle>
        <CardDescription>
          {tSettings("store.queueLimitsDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <StoreQueueNumberField
          id={maxQueueSizeId}
          label={tSettings("store.maxQueueSizeLabel")}
          min={0}
          value={maxQueueSize}
          onChange={onMaxQueueSizeChange}
          inputWidthClassName={inputWidthClassName}
          caption={tSettings("store.maxQueueSizeCaption")}
          error={maxQueueSizeError}
        />
        <StoreQueueNumberField
          id={alertThresholdId}
          label={tSettings("store.alertThresholdLabel")}
          min={1}
          max={10}
          value={alertThreshold}
          onChange={onAlertThresholdChange}
          inputWidthClassName={inputWidthClassName}
          caption={tSettings("store.alertThresholdCaption")}
          error={alertThresholdError}
        />
        {footerAction}
      </CardContent>
    </Card>
  );
}

export function StoreNoShowHandlingCard({
  errors,
  footerAction,
  gracePeriodId,
  gracePeriodSec,
  inputWidthClassName = "max-w-xs",
  maxRequeues,
  maxRequeuesId,
  noShowAction,
  onGracePeriodSecChange,
  onMaxRequeuesChange,
  onNoShowActionChange,
  onRequeueOffsetChange,
  requeueOffset,
  requeueOffsetId,
  visible,
}: StoreNoShowHandlingCardProps) {
  const tSettings = useTranslations("settings");

  if (!visible) {
    return null;
  }

  return (
    <Card className="glass-card glass-context-primary">
      <CardHeader>
        <CardTitle>{tSettings("store.noShowHandling")}</CardTitle>
        <CardDescription>
          {tSettings("store.noShowHandlingDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <StoreQueueNumberField
          id={gracePeriodId}
          label={tSettings("store.gracePeriodLabel")}
          min={0}
          max={600}
          value={gracePeriodSec}
          onChange={onGracePeriodSecChange}
          inputWidthClassName={inputWidthClassName}
          caption={tSettings("store.gracePeriodCaption")}
          error={errors?.gracePeriodSec}
        />

        <div className="space-y-2">
          <Label>{tSettings("store.noShowActionLabel")}</Label>
          <Select
            value={noShowAction}
            onValueChange={(value) => {
              if (value) {
                onNoShowActionChange(value === "REQUEUE" ? "REQUEUE" : "SKIP");
              }
            }}
          >
            <SelectTrigger className={cn("w-full", inputWidthClassName)}>
              <SelectValue>
                {(value: string | null) => {
                  if (value === "SKIP") {
                    return tSettings("store.noShowSkip");
                  }
                  if (value === "REQUEUE") {
                    return tSettings("store.noShowRequeue");
                  }
                  return value;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SKIP">
                {tSettings("store.noShowSkip")}
              </SelectItem>
              <SelectItem value="REQUEUE">
                {tSettings("store.noShowRequeue")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {noShowAction === "REQUEUE" && (
          <>
            <StoreQueueNumberField
              id={maxRequeuesId}
              label={tSettings("store.maxRequeuesLabel")}
              min={1}
              max={5}
              value={maxRequeues}
              onChange={onMaxRequeuesChange}
              inputWidthClassName={inputWidthClassName}
              error={errors?.maxRequeues}
            />
            <StoreQueueNumberField
              id={requeueOffsetId}
              label={tSettings("store.requeueOffsetLabel")}
              min={1}
              max={20}
              value={requeueOffset}
              onChange={onRequeueOffsetChange}
              inputWidthClassName={inputWidthClassName}
              caption={tSettings("store.requeueOffsetCaption")}
              error={errors?.requeueOffset}
            />
          </>
        )}

        {footerAction}
      </CardContent>
    </Card>
  );
}
