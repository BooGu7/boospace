import {
	clearSessionCookie,
	getTikTokConfig,
	isTikTokConfigured,
	readSession,
	requireMethod,
	revokeAccessToken,
	sendJson,
} from "../_lib/tiktok.js";

export default async function handler(req, res) {
	if (!requireMethod(req, res, "POST")) {
		return;
	}

	if (!isTikTokConfigured()) {
		sendJson(res, 200, { ok: true });
		return;
	}

	const config = getTikTokConfig();
	const session = readSession(req, config.sessionSecret);

	if (session?.accessToken) {
		try {
			await revokeAccessToken(session.accessToken, config);
		} catch {
			// Best effort revoke.
		}
	}

	clearSessionCookie(res);
	sendJson(res, 200, { ok: true });
}
