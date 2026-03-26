"use client";

import { DELAY, handleRequest } from "./handlers";

// Patch fetch at module-load time (before any useEffect runs)
if (typeof window !== "undefined") {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.toString();

    // Only intercept API calls
    if (!url.includes("/api/")) {
      return originalFetch(input, init);
    }

    const method = init?.method?.toUpperCase() ?? "GET";
    const path = url.replace(/^https?:\/\/[^/]+/, ""); // strip origin
    let body: unknown;
    if (init?.body) {
      try {
        body = JSON.parse(init.body as string);
      } catch {
        body = null;
      }
    }

    const result = handleRequest(method, path, body);

    // Not handled — pass through to real server
    if (!result) {
      return originalFetch(input, init);
    }

    // SSE stream — return a readable stream with periodic heartbeats
    if (result.body === "__SSE__") {
      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          // Send initial comment to indicate connection
          controller.enqueue(encoder.encode(": connected\n\n"));

          // Send heartbeat every 30 seconds (matches backend)
          const interval = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(": heartbeat\n\n"));
            } catch {
              clearInterval(interval);
            }
          }, 30_000);

          // Clean up on abort
          init?.signal?.addEventListener("abort", () => {
            clearInterval(interval);
            try {
              controller.close();
            } catch {
              // already closed
            }
          });
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Simulate network latency
    await new Promise((r) => setTimeout(r, DELAY));

    const responseBody =
      result.body !== undefined ? JSON.stringify(result.body) : null;

    return new Response(responseBody, {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    });
  };

  console.log(
    "%c[MOCK] API mocking active — all /api/* calls are intercepted",
    "color: #f97316; font-weight: bold",
  );
}

// Render nothing — this component exists only to trigger the module side-effect
export function MockInit() {
  return null;
}
