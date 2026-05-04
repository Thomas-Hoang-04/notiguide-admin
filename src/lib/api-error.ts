import type { ApiError } from "@/types/api";

type ErrorKey =
  | "badRequest"
  | "connectionLost"
  | "forbidden"
  | "notFound"
  | "serverError"
  | "tooManyRequests";

type Translator = (
  key: ErrorKey,
  values?: Record<string, number | string>,
) => string;

export function translateCommonApiError(error: ApiError, tErrors: Translator) {
  if (error.code === 429 && error.rateLimitSeconds) {
    return tErrors("tooManyRequests", { seconds: error.rateLimitSeconds });
  }

  if (error.code === 403) {
    return tErrors("forbidden");
  }

  if (error.code === 404) {
    return tErrors("notFound");
  }

  if (error.code >= 500) {
    return tErrors("serverError");
  }

  if (error.code === 400) {
    return tErrors("badRequest");
  }

  return tErrors("serverError");
}

export function translateNetworkError(tErrors: Translator) {
  return tErrors("connectionLost");
}
