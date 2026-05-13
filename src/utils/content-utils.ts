import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCategoryUrl } from "@utils/url-utils.ts";
import {
	getEntryLocale,
	getEntryTranslationKey,
	getPostPathSlugFromId,
} from "./content-naming";
import { DEFAULT_LOCALE, type SiteLocale } from "./locale-utils";

/**
 * URL segment(s) for links and routes.
 * 1. `pathSlug` — buộc URL cố định (ví dụ hai ngôn ngữ dùng chung một đường dẫn).
 * 2. Đường dẫn từ file (`entry.id`) qua {@link getPostPathSlugFromId}; không phụ thuộc frontmatter `slug`.
 * 3. `slug` trong frontmatter — ghi đè khi cần URL khác hẳn đường dẫn file (legacy).
 * 4. `entry.slug` — dự phòng theo Astro.
 */
export function getCanonicalSlug(entry: CollectionEntry<"posts">): string {
	const pathSlug = entry.data.pathSlug?.trim();
	if (pathSlug) return pathSlug;
	const fromFile = getPostPathSlugFromId(entry.id).trim();
	if (fromFile) return fromFile;
	const dataSlug = entry.data.slug?.trim();
	if (dataSlug) return dataSlug;
	return entry.slug?.trim() ?? "";
}

// // Retrieve posts and sort them by publication date
async function getRawSortedPosts(locale: SiteLocale = DEFAULT_LOCALE) {
	const allBlogPosts = await getCollection("posts", (entry) => {
		const matchesLocale = getEntryLocale(entry) === locale;
		return import.meta.env.PROD
			? entry.data.draft !== true && matchesLocale
			: matchesLocale;
	});

	const sorted = allBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

export async function getSortedPosts(locale: SiteLocale = DEFAULT_LOCALE) {
	const sorted = await getRawSortedPosts(locale);

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = getCanonicalSlug(sorted[i - 1]);
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = getCanonicalSlug(sorted[i + 1]);
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}
export type PostForList = {
	slug: string;
	data: CollectionEntry<"posts">["data"];
};
export async function getSortedPostsList(
	locale: SiteLocale = DEFAULT_LOCALE,
): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts(locale);

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: getCanonicalSlug(post),
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(
	locale: SiteLocale = DEFAULT_LOCALE,
): Promise<Tag[]> {
	const allBlogPosts = await getCollection<"posts">("posts", (entry) => {
		const matchesLocale = getEntryLocale(entry) === locale;
		return import.meta.env.PROD
			? entry.data.draft !== true && matchesLocale
			: matchesLocale;
	});

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
		post.data.tags.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export async function getCategoryList(
	locale: SiteLocale = DEFAULT_LOCALE,
): Promise<Category[]> {
	const allBlogPosts = await getCollection<"posts">("posts", (entry) => {
		const matchesLocale = getEntryLocale(entry) === locale;
		return import.meta.env.PROD
			? entry.data.draft !== true && matchesLocale
			: matchesLocale;
	});
	const count: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { category: string | null } }) => {
		if (!post.data.category) {
			const ucKey = i18n(locale, I18nKey.uncategorized);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c, locale),
		});
	}
	return ret;
}

export async function getTranslatedPostSlug(
	slug: string,
	targetLocale: SiteLocale,
): Promise<string | null> {
	const allBlogPosts = await getCollection("posts");
	const currentEntry = allBlogPosts.find(
		(entry) =>
			getCanonicalSlug(entry) === slug ||
			entry.slug === slug ||
			entry.data.slug?.trim() === slug,
	);

	if (!currentEntry) {
		return null;
	}
	const translationKey = getEntryTranslationKey(currentEntry);

	const translatedEntry = allBlogPosts.find(
		(entry) =>
			entry.id !== currentEntry.id &&
			getEntryTranslationKey(entry) === translationKey &&
			getEntryLocale(entry) === targetLocale,
	);

	return translatedEntry ? getCanonicalSlug(translatedEntry) : null;
}
