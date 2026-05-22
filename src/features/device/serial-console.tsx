"use client";

import { ChevronDown, Pause, Play, Terminal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import "@/styles/usb-console.css";

interface ConsoleEntry {
  id: number;
  text: string;
  level: string;
}

let nextEntryId = 0;

function detectLogLevel(line: string): string {
  if (line.startsWith("E ") || line.startsWith("E (")) return "E";
  if (line.startsWith("W ") || line.startsWith("W (")) return "W";
  if (line.startsWith("I ") || line.startsWith("I (")) return "I";
  if (line.startsWith("D ") || line.startsWith("D (")) return "D";
  return "";
}

interface SerialConsoleProps {
  events: EventTarget;
}

export function SerialConsole({ events }: SerialConsoleProps) {
  const tUsb = useTranslations("devices.usb");

  const [consoleLogs, setConsoleLogs] = useState<ConsoleEntry[]>([]);
  const [consolePaused, setConsolePaused] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const addConsoleLog = useCallback(
    (text: string) => {
      if (consolePaused) return;
      setConsoleLogs((prev) => {
        const next = [
          ...prev,
          { id: nextEntryId++, text, level: detectLogLevel(text) },
        ];
        return next.length > 500 ? next.slice(-500) : next;
      });
      requestAnimationFrame(() => {
        consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    },
    [consolePaused],
  );

  useEffect(() => {
    const handleConsole = (e: Event) => {
      addConsoleLog((e as CustomEvent).detail);
    };
    events.addEventListener("console.log", handleConsole);
    return () => events.removeEventListener("console.log", handleConsole);
  }, [events, addConsoleLog]);

  useEffect(() => {
    if (!consolePaused) {
      consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [consolePaused]);

  return (
    <Collapsible open={consoleOpen} onOpenChange={setConsoleOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <Terminal aria-hidden="true" className="size-4" />
        <span>{tUsb("console_log")}</span>
        <ChevronDown
          aria-hidden="true"
          className="size-3.5 transition-transform [[data-panel-open]_&]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConsolePaused(!consolePaused)}
              className="h-6 px-2 text-xs"
            >
              {consolePaused ? (
                <Play aria-hidden="true" className="mr-1 size-3" />
              ) : (
                <Pause aria-hidden="true" className="mr-1 size-3" />
              )}
              {consolePaused ? tUsb("console_resume") : tUsb("console_pause")}
            </Button>
          </div>
          <div className="usb-console">
            {consoleLogs.map((entry) => (
              <div
                key={entry.id}
                className="usb-console-line"
                data-level={entry.level}
              >
                {entry.text}
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
