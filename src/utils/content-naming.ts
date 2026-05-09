import type { CollectionEntry } from "astro:content";
import { DEFAULT_LOCALE, normalizeLocale, type SiteLocale } from "./locale-utils";

const LOCALE_SUFFIX_PATTERN = /(?:[.-])(en|vi)$/i;

function stripExtension(path: string): string {
	return path.replace(/\.md$/i, "");
}

function getStem(path: string): string {
	const withoutExt = stripExtension(path);
	const normalized = withoutExt.replace(/\\/g, "/");
	const lastSegment = normalized.split("/").pop() || normalized;
	return lastSegment;
}

export function inferLocaleFromId(id: string): SiteLocale | null {
	const stem = getStem(id);
	const match = stem.match(LOCALE_SUFFIX_PATTERN);
	if (!match) return null;
	return normalizeLocale(match[1]);
}

export function inferTranslationKeyFromId(id: string): string {
	const normalized = stripExtension(id).replace(/\\/g, "/");
	return normalized.replace(LOCALE_SUFFIX_PATTERN, "");
}

export function getEntryLocale(
	entry: Pick<CollectionEntry<"posts">, "id" | "data">,
): SiteLocale {
	if (entry.data.lang?.trim()) {
		return normalizeLocale(entry.data.lang);
	}
	return inferLocaleFromId(entry.id) || DEFAULT_LOCALE;
}

export function getEntryTranslationKey(
	entry: Pick<CollectionEntry<"posts">, "id" | "data">,
): string {
	if (entry.data.translationKey?.trim()) {
		return entry.data.translationKey.trim();
	}
	return inferTranslationKeyFromId(entry.id);
}
