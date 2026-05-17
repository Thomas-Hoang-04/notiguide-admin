import type { SerialCommandMap, SerialResponse } from "./types";
import { SERIAL_COMMAND_TIMEOUT_MS } from "./types";

interface PendingRequest {
  resolve: (payload: unknown) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

export class SerialProtocol {
  private pending = new Map<string, PendingRequest>();
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private readLoopActive = false;
  private lineBuffer = "";
  private decoder = new TextDecoder();

  readonly events = new EventTarget();

  async connect(port: SerialPort): Promise<void> {
    if (!port.readable || !port.writable) {
      throw new Error("serial_port_not_open");
    }

    this.writer = port.writable.getWriter();
    this.reader = port.readable.getReader();
    this.lineBuffer = "";
    this.readLoopActive = true;
    void this.runReadLoop();
  }

  async disconnect(): Promise<void> {
    this.readLoopActive = false;

    const reader = this.reader;
    const writer = this.writer;
    this.reader = null;
    this.writer = null;

    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("serial_disconnected"));
      this.pending.delete(id);
    }

    if (reader) {
      try {
        await reader.cancel();
      } catch {
        // ignore cancel errors during teardown
      }
      try {
        reader.releaseLock();
      } catch {
        // ignore if already released
      }
    }

    if (writer) {
      try {
        writer.releaseLock();
      } catch {
        // ignore if already released
      }
    }

    this.lineBuffer = "";
  }

  async send<K extends keyof SerialCommandMap>(
    type: K,
    ...args: SerialCommandMap[K]["payload"] extends undefined
      ? []
      : [payload: SerialCommandMap[K]["payload"]]
  ): Promise<SerialCommandMap[K]["response"]> {
    if (!this.writer) {
      throw new Error("serial_not_connected");
    }

    const id = crypto.randomUUID();
    const payload = args[0];
    const msg = `${JSON.stringify({ id, type, payload })}\n`;

    return new Promise<SerialCommandMap[K]["response"]>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`serial_timeout: ${type}`));
      }, SERIAL_COMMAND_TIMEOUT_MS);

      this.pending.set(id, {
        resolve: (value) => resolve(value as SerialCommandMap[K]["response"]),
        reject,
        timeout,
      });

      this.writer?.write(new TextEncoder().encode(msg)).catch((error) => {
        clearTimeout(timeout);
        this.pending.delete(id);
        reject(
          error instanceof Error ? error : new Error("serial_write_failed"),
        );
      });
    });
  }

  private async runReadLoop(): Promise<void> {
    if (!this.reader) return;
    let unexpectedClose = false;

    try {
      while (this.readLoopActive) {
        const { value, done } = await this.reader.read();
        if (done) {
          unexpectedClose = this.readLoopActive;
          break;
        }

        this.lineBuffer += this.decoder.decode(value, { stream: true });
        const lines = this.lineBuffer.split("\n");
        this.lineBuffer = lines.pop() ?? "";

        for (const line of lines) {
          this.handleLine(line);
        }
      }
    } catch {
      unexpectedClose = this.readLoopActive;
    }

    if (unexpectedClose) {
      await this.disconnect();
      this.events.dispatchEvent(new Event("stream.closed"));
    }
  }

  private handleLine(line: string): void {
    const trimmed = line.replace(/\r$/, "").trim();
    if (!trimmed) return;

    if (trimmed.startsWith("{")) {
      try {
        this.handleProtocolMessage(trimmed);
      } catch {
        this.events.dispatchEvent(
          new CustomEvent("console.log", { detail: trimmed }),
        );
      }
    } else {
      this.events.dispatchEvent(
        new CustomEvent("console.log", { detail: trimmed }),
      );
    }
  }

  private handleProtocolMessage(json: string): void {
    const msg = JSON.parse(json) as
      | SerialResponse
      | { type: string; payload?: unknown };

    if (msg.type === "response" && "id" in msg && this.pending.has(msg.id)) {
      const resp = msg as SerialResponse;
      const pending = this.pending.get(resp.id);
      if (!pending) return;
      const { resolve, reject, timeout } = pending;
      clearTimeout(timeout);
      this.pending.delete(resp.id);
      resp.ok
        ? resolve(resp.payload)
        : reject(new Error(resp.error ?? "serial_error"));
    } else if (typeof msg.type === "string" && msg.type.startsWith("event.")) {
      this.events.dispatchEvent(
        new CustomEvent(msg.type, { detail: msg.payload }),
      );
    }
  }
}
