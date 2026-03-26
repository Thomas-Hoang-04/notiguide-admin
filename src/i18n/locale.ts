import { hasLocale } from "next-intl";
import { type AppLocale, routing } from "./routing";

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export function getCurrentLocaleFromPathname(pathname: string): AppLocale {
  const candidate = pathname.split("/")[1];
  return hasLocale(routing.locales, candidate)
    ? candidate
    : routing.defaultLocale;
}

export function getCurrentLocale(): AppLocale {
  if (typeof window === "undefined") {
    return routing.defaultLocale;
  }

  return getCurrentLocaleFromPathname(window.location.pathname);
}

export function getLocalizedPath(
  path: string,
  locale: AppLocale = getCurrentLocale(),
) {
  return `/${locale}${normalizePath(path)}`;
}
