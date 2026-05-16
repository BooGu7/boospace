import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";
import path from "node:path";
import bannerDefault from "../assets/images/banner_default.png";

const imageModules = import.meta.glob<ImageMetadata>("../**/*.{png,jpg,jpeg,webp,gif,avif}", {
	import: "default",
});

function resolveModuleKey(basePath: string, src: string): string {
	const relative = basePath ? path.join(basePath, src) : src;
	return path.normalize(path.join("../", relative)).replace(/\\/g, "/");
}

/** Absolute Open Graph image URL for a post cover, or the default banner. */
export async function resolvePostOgImageUrl(
	site: URL | string | undefined,
	image: string | undefined,
	basePath: string,
): Promise<string | undefined> {
	if (!site) return undefined;
	const trimmed = typeof image === "string" ? image.trim() : "";
	let meta: ImageMetadata = bannerDefault;
	if (trimmed) {
		const key = resolveModuleKey(basePath, trimmed);
		const load = imageModules[key];
		if (load) {
			meta = await load();
		}
	}
	const optimized = await getImage({ src: meta, width: 1200, height: 630 });
	return new URL(optimized.src, site).href;
}

/** Site-wide OG image from `assets/...` path (e.g. config banner). */
export async function resolveSiteAssetOgImageUrl(
	site: URL | string | undefined,
	assetSrc: string,
): Promise<string | undefined> {
	return resolvePostOgImageUrl(site, assetSrc, "");
}
