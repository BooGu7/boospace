import {
	appendSetCookie,
	clearSessionCookie,
	createSessionCookie,
	ensureFreshSession,
	getMissingConfigKeys,
	getTikTokConfig,
	isTikTokConfigured,
	readSession,
	sendJson,
} from "../_lib/tiktok.js";

export default async function handler(req, res) {
	if (req.method !== "GET") {
		sendJson(res, 405, { ok: false, error: "Method not allowed." });
		return;
	}

	if (!isTikTokConfigured()) {
		sendJson(res, 200, {
			ok: true,
			configured: false,
			missingConfig: getMissingConfigKeys(),
			requestedScopes: [],
			authenticated: false,
		});
		return;
	}

	const config = getTikTokConfig();
	const session = readSession(req, config.sessionSecret);

	if (!session) {
		sendJson(res, 200, {
			ok: true,
			configured: true,
			requestedScopes: config.scopes,
			authenticated: false,
		});
		return;
	}

	try {
		const refreshedSession = await ensureFreshSession(session, config);
		appendSetCookie(
			res,
			createSessionCookie(refreshedSession, config.sessionSecret),
		);

		sendJson(res, 200, {
			ok: true,
			configured: true,
			requestedScopes: config.scopes,
			authenticated: true,
			grantedScopes: refreshedSession.grantedScopes,
			user: refreshedSession.user,
		});
	} catch (error) {
		clearSessionCookie(res);
		sendJson(res, 401, {
			ok: false,
			configured: true,
			authenticated: false,
			error:
				error instanceof Error
					? error.message
					: "TikTok session is no longer valid.",
		});
	}
}
