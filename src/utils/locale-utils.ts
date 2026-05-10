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
	if (pathname === "/en" || pathname.startsWith("/en/")) {
		return "en";
	}
	if (pathname === "/vn" || pathname.startsWith("/vn/")) {
		return "vi";
	}
	return "vi";
}

export function stripLocaleFromPathname(pathname: string): string {
	if (pathname === "/en") {
		return "/";
	}
	if (pathname.startsWith("/en/")) {
		const stripped = pathname.slice(3);
		return stripped.startsWith("/") ? stripped : `/${stripped}`;
	}
	if (pathname === "/vn") {
		return "/";
	}
	if (pathname.startsWith("/vn/")) {
		const stripped = pathname.slice(3);
		return stripped.startsWith("/") ? stripped : `/${stripped}`;
	}
	return pathname || "/";
}

export function normalizePathname(pathname: string): string {
	if (!pathname) return "/";
	let normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
	normalized = normalized.replace(/\/+/g, "/");

	// Never append "/" after `?` — it would turn into `?tag=foo/` and break filters.
	const qIndex = normalized.indexOf("?");
	if (qIndex !== -1) {
		let pathOnly = normalized.slice(0, qIndex);
		const queryOnly = normalized.slice(qIndex);
		if (pathOnly !== "/" && pathOnly !== "" && !pathOnly.endsWith("/")) {
			pathOnly += "/";
		}
		return `${pathOnly}${queryOnly}`;
	}

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
	return normalized === "/" ? "/vn/" : `/vn${normalized}`;
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
