export const DEFAULT_LOCALE = "vi" as const;
export const SUPPORTED_LOCALES = ["vi", "en"] as const;

export type SiteLocale = (typeof SUPPORTED_LOCALES)[number];

export function normalizeLocale(locale?: string | null): SiteLocale {
	if (locale?.toLowerCase() === "en") {
		return "en";
	}
	return DEFAULT_LOCALE;
}

export function getLocaleFromPathname(pathname: string): SiteLocale {
	return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "vi";
}

export function stripLocaleFromPathname(pathname: string): string {
	if (pathname === "/en") {
		return "/";
	}
	if (pathname.startsWith("/en/")) {
		const stripped = pathname.slice(3);
		return stripped.startsWith("/") ? stripped : `/${stripped}`;
	}
	return pathname || "/";
}

export function normalizePathname(pathname: string): string {
	if (!pathname) return "/";
	let normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
	normalized = normalized.replace(/\/+/g, "/");
	if (normalized !== "/" && !normalized.endsWith("/")) {
		normalized += "/";
	}
	return normalized;
}

export function withLocale(pathname: string, locale: SiteLocale): string {
	const normalized = normalizePathname(stripLocaleFromPathname(pathname));
	if (locale === "en") {
		return normalized === "/" ? "/en/" : `/en${normalized}`;
	}
	return normalized;
}

export function isLocaleMatch(
	entryLocale: string | undefined,
	targetLocale: SiteLocale,
): boolean {
	const normalized = normalizeLocale(entryLocale);
	if (!entryLocale || entryLocale.trim() === "") {
		return targetLocale === DEFAULT_LOCALE;
	}
	return normalized === targetLocale;
}
