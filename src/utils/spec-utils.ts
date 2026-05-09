import { getCollection, type CollectionEntry } from "astro:content";
import type { SiteLocale } from "./locale-utils";

const getSpecEntryCandidates = (baseName: string, locale: SiteLocale): string[] => {
	if (locale === "vi") {
		return [`${baseName}-vi`, `${baseName}.vi`, baseName];
	}
	return [`${baseName}-en`, `${baseName}.en`];
};

export async function getLocalizedSpecEntry(
	baseName: string,
	locale: SiteLocale,
): Promise<CollectionEntry<"spec"> | undefined> {
	const entries = await getCollection("spec");
	const candidates = getSpecEntryCandidates(baseName, locale);
	return entries.find((entry) => {
		const keys = [entry.id, (entry as { legacyId?: string }).legacyId]
			.filter(Boolean)
			.map((value) => String(value).replace(/\\/g, "/"));

		return keys.some((key) =>
			candidates.some(
				(candidate) =>
					key === candidate ||
					key === `${candidate}.md` ||
					key.endsWith(`/${candidate}`) ||
					key.endsWith(`/${candidate}.md`),
			),
		);
	});
}
