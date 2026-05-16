export const prerender = true;

import { getRssResponse } from "@utils/rss-response";
import type { APIContext } from "astro";

/** Site-wide RSS at `/rss.xml` for subscribers and crawlers. */
export async function GET(context: APIContext) {
	return getRssResponse(context, "vi");
}
