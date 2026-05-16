export const prerender = true;

import type { APIRoute } from "astro";

/**
 * Sitemap index at `/sitemap-index.xml` (works in `astro dev` and static build).
 * Child: `/sitemap-0.xml`
 */
export const GET: APIRoute = ({ site }) => {
	const base = site ?? new URL("https://boospace.tech/");
	const indexUrl = new URL("sitemap-0.xml", base.href).href;
	const body = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${escapeXml(indexUrl)}</loc></sitemap></sitemapindex>`;
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
