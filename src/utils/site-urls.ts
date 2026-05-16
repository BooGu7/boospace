import { getCollection } from "astro:content";
import { getEntryLocale } from "@utils/content-naming";
import { getCanonicalSlug } from "@utils/content-utils";

/** Relative paths with trailing slashes for every HTML route we expose (matches former @astrojs/sitemap output). */
export async function getAllPublicPaths(): Promise<string[]> {
	const paths = new Set<string>();

	const roots = [
		"/about/",
		"/archive/",
		"/login/",
		"/privacy-policy/",
		"/privacypolicy/",
		"/terms-of-service/",
	];
	for (const p of roots) paths.add(p);

	const locales = ["en", "vn"] as const;
	const suffixes = [
		"/",
		"/about/",
		"/archive/",
		"/login/",
		"/privacy-policy/",
		"/terms-of-service/",
	];
	for (const locale of locales) {
		for (const suf of suffixes) {
			paths.add(suf === "/" ? `/${locale}/` : `/${locale}${suf}`);
		}
	}

	const posts = await getCollection("posts", (entry) =>
		import.meta.env.PROD ? entry.data.draft !== true : true,
	);

	for (const post of posts) {
		const slug = getCanonicalSlug(post);
		const loc = getEntryLocale(post);
		if (loc === "vi") {
			paths.add(`/posts/${slug}/`);
			paths.add(`/vn/posts/${slug}/`);
		}
		if (loc === "en") {
			paths.add(`/en/posts/${slug}/`);
		}
	}

	return [...paths].sort();
}

export function toAbsoluteSiteUrls(site: URL, paths: string[]): string[] {
	const base = site.href.endsWith("/") ? site.href : `${site.href}/`;
	return paths.map((p) => new URL(p, base).href);
}
