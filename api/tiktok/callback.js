import {
	appendSetCookie,
	clearSessionCookie,
	createSessionCookie,
	createSessionFromTokenPayload,
	exchangeCodeForToken,
	fetchBasicUserInfo,
	getMissingConfigKeys,
	getTikTokConfig,
	isTikTokConfigured,
	parseOauthStateToken,
	readQuery,
	redirect,
	withLoginError,
	withLoginSuccess,
} from "../_lib/tiktok.js";

export default async function handler(req, res) {
	if (req.method !== "GET") {
		res.statusCode = 405;
		res.end("Method not allowed.");
		return;
	}

	const fallbackPath = "/login/";

	if (!isTikTokConfigured()) {
		redirect(
			res,
			withLoginError(
				fallbackPath,
				`Missing config: ${getMissingConfigKeys().join(", ")}`,
			),
		);
		return;
	}

	const config = getTikTokConfig();
	const query = readQuery(req);
	const error = query.get("error");
	const stateToken = query.get("state");
	const state = parseOauthStateToken(stateToken, config.sessionSecret);
	const returnTo = state?.returnTo || fallbackPath;

	if (!state) {
		redirect(res, withLoginError(returnTo, "Invalid or expired TikTok state."));
		return;
	}

	if (error) {
		redirect(res, withLoginError(returnTo, error));
		return;
	}

	const code = query.get("code");

	if (!code) {
		redirect(
			res,
			withLoginError(returnTo, "TikTok did not return an auth code."),
		);
		return;
	}

	try {
		const tokenPayload = await exchangeCodeForToken(code, config);
		const basicUser = await fetchBasicUserInfo(tokenPayload.access_token);
		const session = createSessionFromTokenPayload(tokenPayload, basicUser);

		appendSetCookie(res, createSessionCookie(session, config.sessionSecret));
		redirect(res, withLoginSuccess(returnTo));
	} catch (errorMessage) {
		clearSessionCookie(res);
		redirect(
			res,
			withLoginError(
				returnTo,
				errorMessage instanceof Error
					? errorMessage.message
					: "TikTok login failed.",
			),
		);
	}
}
