import rss from "@astrojs/rss";
import { getCanonicalSlug, getSortedPosts } from "@utils/content-utils";
import type { SiteLocale } from "@utils/locale-utils";
import { url } from "@utils/url-utils";
import type { APIContext } from "astro";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";
import { siteConfig } from "@/config";

const parser = new MarkdownIt();

function stripInvalidXmlChars(str: string): string {
	return str.replace(
		// biome-ignore lint/suspicious/noControlCharactersInRegex: https://www.w3.org/TR/xml/#charsets
		/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]/g,
		"",
	);
}

/** RSS feed for a locale (used by root `/rss.xml`). */
export async function getRssResponse(context: APIContext, locale: SiteLocale) {
	const blog = await getSortedPosts(locale);
	const base = context.site ?? new URL("https://boospace.tech");

	const items = blog.map((post) => {
		const content =
			typeof post.body === "string" ? post.body : String(post.body || "");
		const cleanedContent = stripInvalidXmlChars(content);
		const slugPath = getCanonicalSlug(post);
		const pathname = url(`/posts/${slugPath}/`, locale);
		const link = new URL(pathname, base).href;

		return {
			title: post.data.title,
			pubDate: post.data.published,
			description: post.data.description || "",
			link,
			content: sanitizeHtml(parser.render(cleanedContent), {
				allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
			}),
		};
	});

	const langTag = locale === "en" ? "en" : siteConfig.lang;

	return rss({
		title: siteConfig.title,
		description: siteConfig.subtitle || "No description",
		site: base,
		items,
		customData: `<language>${langTag}</language>`,
	});
}
