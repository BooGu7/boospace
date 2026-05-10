import {
	getAllPublicPaths,
	toAbsoluteSiteUrls,
} from "@utils/site-urls";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ site }) => {
	const base = site ?? new URL("https://boospace.tech/");
	const paths = await getAllPublicPaths();
	const urls = toAbsoluteSiteUrls(base, paths);
	const inner = urls
		.map((loc) => `<url><loc>${escapeXml(loc)}</loc></url>`)
		.join("");
	const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${inner}</urlset>`;
	return new Response(body, {
		headers: { "Content-Type": "application/xml; charset=utf-8" },
	});
};

function escapeXml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
