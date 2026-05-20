"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SerialProtocol } from "./serial-protocol";
import { hasWebSerialSupport } from "./support";
import type { SerialCommandMap, StatusPayload } from "./types";
import {
  ESP32_C3_USB_FILTER,
  SERIAL_BAUD_RATE,
  SERIAL_SESSION_POLL_INTERVAL_MS,
} from "./types";

export type PortState = "closed" | "opening" | "open" | "closing";

export interface UseSerialReturn {
  canUseSerial: boolean;
  portState: PortState;
  connect: () => Promise<void>;
  reconnectKnownPort: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshStatus: () => Promise<StatusPayload | null>;
  sendCommand: <K extends keyof SerialCommandMap>(
    type: K,
    ...args: SerialCommandMap[K]["payload"] extends undefined
      ? []
      : [payload: SerialCommandMap[K]["payload"]]
  ) => Promise<SerialCommandMap[K]["response"]>;
  deviceState: StatusPayload | null;
  events: EventTarget;
}

export function useSerial(): UseSerialReturn {
  const [canUseSerial, setCanUseSerial] = useState(false);
  const [portState, setPortState] = useState<PortState>("closed");
  const [deviceState, setDeviceState] = useState<StatusPayload | null>(null);

  const portRef = useRef<SerialPort | null>(null);
  const portStateRef = useRef<PortState>("closed");
  const protocolRef = useRef(new SerialProtocol());
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const manualConnectRef = useRef(false);

  useEffect(() => {
    setCanUseSerial(hasWebSerialSupport());
  }, []);

  const updatePortState = useCallback((next: PortState) => {
    portStateRef.current = next;
    setPortState(next);
  }, []);

  const mergeEventIntoState = useCallback(
    (type: string, payload: Record<string, unknown>) => {
      setDeviceState((prev) => {
        if (!prev) return prev;
        switch (type) {
          case "event.wifi_connected":
            return { ...prev, wifi_connected: true };
          case "event.wifi_disconnected":
            return {
              ...prev,
              wifi_connected: false,
              wifi_ssid: undefined,
              wifi_rssi: undefined,
              ip: undefined,
            };
          case "event.mqtt_connected":
            return { ...prev, mqtt_connected: true };
          case "event.mqtt_disconnected":
            return { ...prev, mqtt_connected: false };
          case "event.activated":
            return { ...prev, activated: true, op_state: "ACTIVE" };
          case "event.lifecycle_changed":
            return {
              ...prev,
              op_state: (payload.op_state as string) ?? prev.op_state,
            };
          default:
            return prev;
        }
      });
    },
    [],
  );

  const stopStatusPoll = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const startStatusPoll = useCallback(() => {
    stopStatusPoll();
    pollIntervalRef.current = setInterval(async () => {
      try {
        const status = await protocolRef.current.send("status");
        setDeviceState(status);
      } catch {
        // ignore poll failures — device may be busy or disconnected
      }
    }, SERIAL_SESSION_POLL_INTERVAL_MS);
  }, [stopStatusPoll]);

  const refreshStatus = useCallback(async (): Promise<StatusPayload | null> => {
    try {
      const status = await protocolRef.current.send("status");
      setDeviceState(status);
      return status;
    } catch {
      return null;
    }
  }, []);

  const openPort = useCallback(
    async (port: SerialPort) => {
      updatePortState("opening");
      try {
        await port.open({ baudRate: SERIAL_BAUD_RATE });
        await protocolRef.current.connect(port);
        portRef.current = port;
        updatePortState("open");

        const status = await protocolRef.current.send("status");
        setDeviceState(status);
        startStatusPoll();
      } catch (error) {
        stopStatusPoll();
        await protocolRef.current.disconnect();
        try {
          await port.close();
        } catch {
          // ignore close errors after a partially opened port
        }
        portRef.current = null;
        updatePortState("closed");
        throw error;
      }
    },
    [startStatusPoll, stopStatusPoll, updatePortState],
  );

  const connect = useCallback(async () => {
    if (!canUseSerial) throw new Error("serial_not_supported");
    if (portStateRef.current !== "closed") return;

    manualConnectRef.current = true;
    try {
      const port = await navigator.serial.requestPort({
        filters: [ESP32_C3_USB_FILTER],
      });

      try {
        await openPort(port);
        return;
      } catch {
        // First-time pairing may cause a CDC-ACM USB enumeration reset,
        // leaving the original port object in a broken state. Wait for
        // re-enumeration, then get a fresh port reference via getPorts().
      }

      updatePortState("opening");
      await new Promise((resolve) => setTimeout(resolve, 2_000));

      const ports = await navigator.serial.getPorts();
      const freshPort = ports.find((p) => {
        const info = p.getInfo();
        return (
          info.usbVendorId === ESP32_C3_USB_FILTER.usbVendorId &&
          info.usbProductId === ESP32_C3_USB_FILTER.usbProductId
        );
      });

      if (freshPort) {
        await openPort(freshPort);
      }
    } finally {
      manualConnectRef.current = false;
    }
  }, [canUseSerial, openPort, updatePortState]);

  const reconnectKnownPort = useCallback(async () => {
    if (!canUseSerial) return;
    if (portStateRef.current !== "closed") return;

    const ports = await navigator.serial.getPorts();
    const espPort = ports.find((p) => {
      const info = p.getInfo();
      return (
        info.usbVendorId === ESP32_C3_USB_FILTER.usbVendorId &&
        info.usbProductId === ESP32_C3_USB_FILTER.usbProductId
      );
    });
    if (espPort) {
      await openPort(espPort);
    }
  }, [canUseSerial, openPort]);

  const disconnect = useCallback(async () => {
    if (portStateRef.current !== "open") return;
    updatePortState("closing");
    stopStatusPoll();
    setDeviceState(null);

    await protocolRef.current.disconnect();

    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch {
        // ignore close errors
      }
      portRef.current = null;
    }

    updatePortState("closed");
  }, [stopStatusPoll, updatePortState]);

  const sendCommand = useCallback(
    <K extends keyof SerialCommandMap>(
      type: K,
      ...args: SerialCommandMap[K]["payload"] extends undefined
        ? []
        : [payload: SerialCommandMap[K]["payload"]]
    ): Promise<SerialCommandMap[K]["response"]> => {
      return protocolRef.current.send(type, ...args);
    },
    [],
  );

  useEffect(() => {
    const protocol = protocolRef.current;

    const handleEvent = (e: Event) => {
      const ce = e as CustomEvent;
      mergeEventIntoState(e.type, ce.detail ?? {});
    };

    const eventTypes = [
      "event.wifi_connected",
      "event.wifi_disconnected",
      "event.mqtt_connected",
      "event.mqtt_disconnected",
      "event.activated",
      "event.lifecycle_changed",
    ];

    for (const type of eventTypes) {
      protocol.events.addEventListener(type, handleEvent);
    }

    const handleStreamClosed = () => {
      stopStatusPoll();
      setDeviceState(null);
      portRef.current = null;
      updatePortState("closed");
    };

    protocol.events.addEventListener("stream.closed", handleStreamClosed);

    return () => {
      for (const type of eventTypes) {
        protocol.events.removeEventListener(type, handleEvent);
      }
      protocol.events.removeEventListener("stream.closed", handleStreamClosed);
    };
  }, [mergeEventIntoState, stopStatusPoll, updatePortState]);

  useEffect(() => {
    if (!canUseSerial) return;

    const handleSerialDisconnect = (e: Event) => {
      if (portRef.current && e.target === portRef.current) {
        stopStatusPoll();
        void protocolRef.current.disconnect();
        setDeviceState(null);
        portRef.current = null;
        updatePortState("closed");
      }
    };

    const handleSerialConnect = (e: Event) => {
      if (manualConnectRef.current) return;
      if (portStateRef.current !== "closed") return;
      const port = e.target as SerialPort;
      const info = port.getInfo();
      if (
        info.usbVendorId === ESP32_C3_USB_FILTER.usbVendorId &&
        info.usbProductId === ESP32_C3_USB_FILTER.usbProductId
      ) {
        void openPort(port).catch(() => {
          portRef.current = null;
          updatePortState("closed");
        });
      }
    };

    navigator.serial.addEventListener("disconnect", handleSerialDisconnect);
    navigator.serial.addEventListener("connect", handleSerialConnect);
    return () => {
      navigator.serial.removeEventListener(
        "disconnect",
        handleSerialDisconnect,
      );
      navigator.serial.removeEventListener("connect", handleSerialConnect);
    };
  }, [canUseSerial, openPort, stopStatusPoll, updatePortState]);

  useEffect(() => {
    return () => {
      stopStatusPoll();
      void protocolRef.current.disconnect();
      if (portRef.current) {
        portRef.current.close().catch(() => {});
        portRef.current = null;
      }
    };
  }, [stopStatusPoll]);

  return {
    canUseSerial,
    portState,
    connect,
    reconnectKnownPort,
    disconnect,
    refreshStatus,
    sendCommand,
    deviceState,
    events: protocolRef.current.events,
  };
}
