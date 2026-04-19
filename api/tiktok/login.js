import {
	buildAuthorizeUrl,
	getMissingConfigKeys,
	isTikTokConfigured,
	readQuery,
	redirect,
	sendJson,
} from "../_lib/tiktok.js";

export default async function handler(req, res) {
	if (req.method !== "GET") {
		sendJson(res, 405, { ok: false, error: "Method not allowed." });
		return;
	}

	if (!isTikTokConfigured()) {
		sendJson(res, 500, {
			ok: false,
			error: "TikTok integration is not configured.",
			missingConfig: getMissingConfigKeys(),
		});
		return;
	}

	const query = readQuery(req);
	const returnTo = query.get("returnTo") || "/login/";
	redirect(res, buildAuthorizeUrl(returnTo));
}
