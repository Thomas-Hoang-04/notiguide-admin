import { describe, expect, it, vi } from "vitest";
import {
  translateCommonApiError,
  translateNetworkError,
} from "@/lib/api-error";
import type { ApiError } from "@/types/api";

// The translators only read `code` and `rateLimitSeconds`, so partial literals
// cast to ApiError keep each case focused on the branch under test.
const apiError = (partial: Partial<ApiError>) => partial as unknown as ApiError;

// Stub translator: returns the key so assertions can match on it directly.
const tErrors = (key: string) => key;

describe("translateCommonApiError", () => {
  it("maps a rate-limited 429 to tooManyRequests and forwards the retry seconds", () => {
    const spy = vi.fn(tErrors);
    const message = translateCommonApiError(
      apiError({ code: 429, rateLimitSeconds: 30 }),
      spy as never,
    );
    expect(message).toBe("tooManyRequests");
    expect(spy).toHaveBeenCalledWith("tooManyRequests", { seconds: 30 });
  });

  it("falls back to serverError for a 429 without retry seconds", () => {
    expect(
      translateCommonApiError(apiError({ code: 429 }), tErrors as never),
    ).toBe("serverError");
  });

  it("maps 403 to forbidden", () => {
    expect(
      translateCommonApiError(apiError({ code: 403 }), tErrors as never),
    ).toBe("forbidden");
  });

  it("maps 404 to notFound", () => {
    expect(
      translateCommonApiError(apiError({ code: 404 }), tErrors as never),
    ).toBe("notFound");
  });

  it("maps 400 to badRequest", () => {
    expect(
      translateCommonApiError(apiError({ code: 400 }), tErrors as never),
    ).toBe("badRequest");
  });

  it("maps any 5xx to serverError", () => {
    expect(
      translateCommonApiError(apiError({ code: 503 }), tErrors as never),
    ).toBe("serverError");
  });

  it("maps an unrecognized status to serverError", () => {
    expect(
      translateCommonApiError(apiError({ code: 418 }), tErrors as never),
    ).toBe("serverError");
  });
});

describe("translateNetworkError", () => {
  it("maps a network failure to connectionLost", () => {
    expect(translateNetworkError(tErrors as never)).toBe("connectionLost");
  });
});
