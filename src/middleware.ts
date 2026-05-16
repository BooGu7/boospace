import { defineMiddleware } from "astro:middleware";

import {
	LOCALE_COOKIE,
	type StoredLocale,
} from "./constants/locale-preference";

const ONE_YEAR_SEC = 60 * 60 * 24 * 365;

function isSiteRoot(pathname: string): boolean {
	const normalized = pathname.replace(/\/+$/, "");
	return normalized === "" || normalized === "/";
}

function parseCookie(header: string | null, name: string): string | null {
	if (!header) return null;
	for (const part of header.split(";")) {
		const idx = part.indexOf("=");
		if (idx === -1) continue;
		const k = part.slice(0, idx).trim();
		if (k !== name) continue;
		return decodeURIComponent(part.slice(idx + 1).trim());
	}
	return null;
}

function localeFromAcceptLanguage(header: string | null): StoredLocale | null {
	if (!header) return null;
	const items = header.split(",").map((part) => {
		const [tag, ...params] = part.trim().split(";");
		const qParam = params.find((x) =>
			x.trim().toLowerCase().startsWith("q="),
		);
		const q = qParam ? Number.parseFloat(qParam.split("=")[1] ?? "") : 1;
		return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 1 };
	});
	items.sort((a, b) => b.q - a.q);
	for (const { tag } of items) {
		const base = tag.split("-")[0] ?? "";
		if (base === "vi") return "vi";
		if (base === "en") return "en";
	}
	return null;
}

function inferLocale(request: Request): StoredLocale {
	const fromCookie = parseCookie(request.headers.get("cookie"), LOCALE_COOKIE);
	if (fromCookie === "vi" || fromCookie === "en") return fromCookie;

	const fromAl = localeFromAcceptLanguage(
		request.headers.get("accept-language"),
	);
	if (fromAl) return fromAl;

	const country =
		request.headers.get("x-vercel-ip-country")?.trim() ||
		request.headers.get("cf-ipcountry")?.trim() ||
		"";
	if (country === "VN") return "vi";

	return "en";
}

function redirectToLocale(
	url: URL,
	locale: StoredLocale,
): Response {
	const path = locale === "vi" ? "/vn/" : "/en/";
	const location = new URL(path, url.origin).href;
	const secure = url.protocol === "https:";
	const cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${ONE_YEAR_SEC}; SameSite=Lax${secure ? "; Secure" : ""}`;

	return new Response(null, {
		status: 302,
		headers: {
			Location: location,
			"Set-Cookie": cookie,
			"Cache-Control": "private, no-store",
			Vary: "Cookie, Accept-Language",
		},
	});
}

export const onRequest = defineMiddleware((context, next) => {
	if (!isSiteRoot(context.url.pathname)) {
		return next();
	}
	const locale = inferLocale(context.request);
	return redirectToLocale(context.url, locale);
});
