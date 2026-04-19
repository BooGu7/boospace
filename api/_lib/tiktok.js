import { createHmac, timingSafeEqual } from "node:crypto";

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const SESSION_COOKIE_NAME = "boospace_tiktok_session";
const DEFAULT_SCOPES = ["user.info.basic", "video.upload"];
const MIN_CHUNK_BYTES = 5 * 1024 * 1024;
const MAX_CHUNK_BYTES = 64 * 1024 * 1024;
const MAX_FINAL_CHUNK_BYTES = 128 * 1024 * 1024;
const MAX_TOTAL_CHUNKS = 1000;
const MAX_VIDEO_BYTES = 4 * 1024 * 1024 * 1024;
const SESSION_REFRESH_WINDOW_MS = 60 * 1000;

function ensureString(value, fallback = "") {
	return typeof value === "string" ? value : fallback;
}

function toBase64Url(value) {
	return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value) {
	return Buffer.from(value, "base64url").toString("utf8");
}

function signValue(value, secret) {
	return createHmac("sha256", secret).update(value).digest("base64url");
}

export function sendJson(res, statusCode, payload) {
	res.statusCode = statusCode;
	res.setHeader("Content-Type", "application/json; charset=utf-8");
	res.end(JSON.stringify(payload));
}

export function redirect(res, location) {
	res.statusCode = 302;
	res.setHeader("Location", location);
	res.end();
}

export function appendSetCookie(res, cookieValue) {
	const current = res.getHeader("Set-Cookie");
	if (!current) {
		res.setHeader("Set-Cookie", cookieValue);
		return;
	}
	if (Array.isArray(current)) {
		res.setHeader("Set-Cookie", [...current, cookieValue]);
		return;
	}
	res.setHeader("Set-Cookie", [current, cookieValue]);
}

function serializeCookie(name, value, options = {}) {
	const cookieParts = [`${name}=${encodeURIComponent(value)}`];

	if (options.maxAge !== undefined) {
		cookieParts.push(`Max-Age=${options.maxAge}`);
	}

	cookieParts.push(`Path=${options.path || "/"}`);
	cookieParts.push(`SameSite=${options.sameSite || "Lax"}`);

	if (options.httpOnly !== false) {
		cookieParts.push("HttpOnly");
	}

	if (options.secure) {
		cookieParts.push("Secure");
	}

	return cookieParts.join("; ");
}

function useSecureCookies() {
	return process.env.NODE_ENV === "production";
}

export function clearSessionCookie(res) {
	appendSetCookie(
		res,
		serializeCookie(SESSION_COOKIE_NAME, "", {
			maxAge: 0,
			secure: useSecureCookies(),
		}),
	);
}

export function readCookies(req) {
	const cookieHeader = ensureString(req.headers?.cookie);
	if (!cookieHeader) {
		return {};
	}

	return cookieHeader.split(";").reduce((cookies, part) => {
		const [rawKey, ...rawValue] = part.trim().split("=");
		if (!rawKey) {
			return cookies;
		}
		cookies[rawKey] = decodeURIComponent(rawValue.join("="));
		return cookies;
	}, {});
}

export function createSignedToken(payload, secret) {
	const encodedPayload = toBase64Url(JSON.stringify(payload));
	const signature = signValue(encodedPayload, secret);
	return `${encodedPayload}.${signature}`;
}

export function parseSignedToken(token, secret) {
	if (!token || !token.includes(".")) {
		return null;
	}

	const [encodedPayload, signature] = token.split(".");
	const expectedSignature = signValue(encodedPayload, secret);

	try {
		if (signature.length !== expectedSignature.length) {
			return null;
		}
		const matches = timingSafeEqual(
			Buffer.from(signature),
			Buffer.from(expectedSignature),
		);
		if (!matches) {
			return null;
		}
		return JSON.parse(fromBase64Url(encodedPayload));
	} catch {
		return null;
	}
}

export function createSessionCookie(session, secret) {
	const token = createSignedToken(session, secret);
	const now = Date.now();
	const maxAgeSeconds = Math.max(
		0,
		Math.floor((session.refreshExpiresAt - now) / 1000),
	);

	return serializeCookie(SESSION_COOKIE_NAME, token, {
		maxAge: maxAgeSeconds,
		secure: useSecureCookies(),
	});
}

export function readSession(req, secret) {
	const cookies = readCookies(req);
	const token = cookies[SESSION_COOKIE_NAME];
	if (!token) {
		return null;
	}

	const session = parseSignedToken(token, secret);
	if (!session) {
		return null;
	}

	if (!session.refreshExpiresAt || session.refreshExpiresAt <= Date.now()) {
		return null;
	}

	return session;
}

export function readQuery(req) {
	const url = new URL(req.url || "/", "https://boospace.local");
	return url.searchParams;
}

export async function readRawBody(req) {
	const chunks = [];

	for await (const chunk of req) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	}

	return Buffer.concat(chunks);
}

export async function readJsonBody(req) {
	if (req.body && typeof req.body === "object") {
		return req.body;
	}

	const rawBody = await readRawBody(req);
	if (!rawBody.length) {
		return {};
	}

	return JSON.parse(rawBody.toString("utf8"));
}

export function getTikTokConfig() {
	const clientKey = ensureString(process.env.TIKTOK_CLIENT_KEY);
	const clientSecret = ensureString(process.env.TIKTOK_CLIENT_SECRET);
	const redirectUri = ensureString(process.env.TIKTOK_REDIRECT_URI);
	const sessionSecret = ensureString(process.env.TIKTOK_SESSION_SECRET);
	const scopes = ensureString(process.env.TIKTOK_SCOPES)
		.split(",")
		.map((scope) => scope.trim())
		.filter(Boolean);

	return {
		clientKey,
		clientSecret,
		redirectUri,
		sessionSecret,
		scopes: scopes.length > 0 ? scopes : DEFAULT_SCOPES,
	};
}

export function isTikTokConfigured() {
	const config = getTikTokConfig();
	return Boolean(
		config.clientKey &&
			config.clientSecret &&
			config.redirectUri &&
			config.sessionSecret,
	);
}

export function getMissingConfigKeys() {
	const config = getTikTokConfig();
	const missingKeys = [];

	if (!config.clientKey) missingKeys.push("TIKTOK_CLIENT_KEY");
	if (!config.clientSecret) missingKeys.push("TIKTOK_CLIENT_SECRET");
	if (!config.redirectUri) missingKeys.push("TIKTOK_REDIRECT_URI");
	if (!config.sessionSecret) missingKeys.push("TIKTOK_SESSION_SECRET");

	return missingKeys;
}

export function normalizeReturnTo(input) {
	if (!input || typeof input !== "string") {
		return "/login/";
	}

	if (!input.startsWith("/") || input.startsWith("//")) {
		return "/login/";
	}

	return input;
}

export function buildOauthStateToken(returnTo, secret) {
	return createSignedToken(
		{
			returnTo: normalizeReturnTo(returnTo),
			issuedAt: Date.now(),
		},
		secret,
	);
}

export function parseOauthStateToken(token, secret) {
	const parsed = parseSignedToken(token, secret);
	if (!parsed) {
		return null;
	}

	if (
		typeof parsed.issuedAt !== "number" ||
		Date.now() - parsed.issuedAt > OAUTH_STATE_TTL_MS
	) {
		return null;
	}

	return {
		returnTo: normalizeReturnTo(parsed.returnTo),
	};
}

function appendQueryValue(pathname, key, value) {
	const target = new URL(pathname, "https://boospace.local");
	target.searchParams.set(key, value);
	return `${target.pathname}${target.search}`;
}

export function withLoginSuccess(pathname) {
	return appendQueryValue(pathname, "tiktok", "connected");
}

export function withLoginError(pathname, error) {
	return appendQueryValue(pathname, "tiktok_error", error);
}

async function parseResponse(response) {
	const contentType = ensureString(response.headers.get("content-type"));

	if (contentType.includes("application/json")) {
		return response.json();
	}

	const text = await response.text();
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

async function requestTikTokJson(url, init) {
	const response = await fetch(url, init);
	const payload = await parseResponse(response);

	return {
		ok: response.ok,
		status: response.status,
		payload,
	};
}

function extractTikTokErrorMessage(payload, fallbackMessage) {
	if (!payload) {
		return fallbackMessage;
	}

	if (typeof payload.error_description === "string") {
		return payload.error_description;
	}

	if (payload.error && typeof payload.error.message === "string") {
		return payload.error.message;
	}

	if (typeof payload.message === "string") {
		return payload.message;
	}

	return fallbackMessage;
}

export async function exchangeCodeForToken(code, config) {
	const body = new URLSearchParams({
		client_key: config.clientKey,
		client_secret: config.clientSecret,
		code,
		grant_type: "authorization_code",
		redirect_uri: config.redirectUri,
	});

	const { ok, payload, status } = await requestTikTokJson(
		"https://open.tiktokapis.com/v2/oauth/token/",
		{
			method: "POST",
			headers: {
				"Cache-Control": "no-cache",
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body,
		},
	);

	if (!ok) {
		throw new Error(
			extractTikTokErrorMessage(payload, `TikTok token exchange failed (${status}).`),
		);
	}

	return payload;
}

export async function refreshAccessToken(session, config) {
	const body = new URLSearchParams({
		client_key: config.clientKey,
		client_secret: config.clientSecret,
		grant_type: "refresh_token",
		refresh_token: session.refreshToken,
	});

	const { ok, payload, status } = await requestTikTokJson(
		"https://open.tiktokapis.com/v2/oauth/token/",
		{
			method: "POST",
			headers: {
				"Cache-Control": "no-cache",
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body,
		},
	);

	if (!ok) {
		throw new Error(
			extractTikTokErrorMessage(payload, `TikTok token refresh failed (${status}).`),
		);
	}

	return createSessionFromTokenPayload(payload, session.user);
}

export async function revokeAccessToken(accessToken, config) {
	const body = new URLSearchParams({
		client_key: config.clientKey,
		client_secret: config.clientSecret,
		token: accessToken,
	});

	await fetch("https://open.tiktokapis.com/v2/oauth/revoke/", {
		method: "POST",
		headers: {
			"Cache-Control": "no-cache",
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body,
	});
}

export async function fetchBasicUserInfo(accessToken) {
	const fields = ["open_id", "display_name", "avatar_url", "avatar_large_url"].join(
		",",
	);

	const { ok, payload, status } = await requestTikTokJson(
		`https://open.tiktokapis.com/v2/user/info/?fields=${encodeURIComponent(fields)}`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
	);

	if (!ok || payload?.error?.code !== "ok") {
		throw new Error(
			extractTikTokErrorMessage(payload, `TikTok user info request failed (${status}).`),
		);
	}

	return payload.data.user;
}

export function createSessionFromTokenPayload(tokenPayload, user) {
	const now = Date.now();
	const scopeList = ensureString(tokenPayload.scope)
		.split(",")
		.map((scope) => scope.trim())
		.filter(Boolean);

	return {
		openId: tokenPayload.open_id,
		accessToken: tokenPayload.access_token,
		refreshToken: tokenPayload.refresh_token,
		accessExpiresAt: now + Number(tokenPayload.expires_in || 0) * 1000,
		refreshExpiresAt: now + Number(tokenPayload.refresh_expires_in || 0) * 1000,
		grantedScopes: scopeList,
		user: user
			? {
					openId: user.open_id,
					displayName: user.display_name,
					avatarUrl: user.avatar_large_url || user.avatar_url || "",
				}
			: null,
	};
}

export async function ensureFreshSession(session, config) {
	if (session.accessExpiresAt > Date.now() + SESSION_REFRESH_WINDOW_MS) {
		return session;
	}

	const refreshedSession = await refreshAccessToken(session, config);

	if (!refreshedSession.user) {
		refreshedSession.user = session.user;
	}

	return refreshedSession;
}

export function requireMethod(req, res, method) {
	if (req.method !== method) {
		sendJson(res, 405, {
			ok: false,
			error: `Method ${req.method} not allowed.`,
		});
		return false;
	}

	return true;
}

export async function getAuthenticatedSession(req, res, options = {}) {
	if (!isTikTokConfigured()) {
		sendJson(res, 500, {
			ok: false,
			error: "TikTok integration is not configured.",
			missingConfig: getMissingConfigKeys(),
		});
		return null;
	}

	const config = getTikTokConfig();
	let session = readSession(req, config.sessionSecret);

	if (!session) {
		sendJson(res, 401, {
			ok: false,
			error: "TikTok account is not connected.",
		});
		return null;
	}

	try {
		session = await ensureFreshSession(session, config);
		appendSetCookie(res, createSessionCookie(session, config.sessionSecret));
	} catch (error) {
		clearSessionCookie(res);
		sendJson(res, 401, {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "TikTok session expired. Please log in again.",
		});
		return null;
	}

	if (
		options.requiredScopes &&
		!options.requiredScopes.every((scope) => session.grantedScopes.includes(scope))
	) {
		sendJson(res, 403, {
			ok: false,
			error: `Missing required scopes: ${options.requiredScopes.join(", ")}`,
			grantedScopes: session.grantedScopes,
		});
		return null;
	}

	return { config, session };
}

export function buildAuthorizeUrl(returnTo) {
	const config = getTikTokConfig();
	const state = buildOauthStateToken(returnTo, config.sessionSecret);
	const params = new URLSearchParams({
		client_key: config.clientKey,
		redirect_uri: config.redirectUri,
		response_type: "code",
		scope: config.scopes.join(","),
		state,
		disable_auto_auth: "1",
	});

	return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

export function createChunkPlan(videoSize) {
	if (!Number.isFinite(videoSize) || videoSize <= 0) {
		throw new Error("Invalid video size.");
	}

	if (videoSize > MAX_VIDEO_BYTES) {
		throw new Error("TikTok upload demo supports files up to 4 GB.");
	}

	if (videoSize < MIN_CHUNK_BYTES) {
		return {
			chunkSize: videoSize,
			totalChunkCount: 1,
		};
	}

	if (videoSize <= MAX_CHUNK_BYTES) {
		return {
			chunkSize: videoSize,
			totalChunkCount: 1,
		};
	}

	let totalChunkCount = Math.ceil(videoSize / MAX_CHUNK_BYTES);

	while (totalChunkCount <= MAX_TOTAL_CHUNKS) {
		const chunkSize = Math.floor(videoSize / totalChunkCount);
		const finalChunkSize = videoSize - chunkSize * (totalChunkCount - 1);

		if (
			chunkSize >= MIN_CHUNK_BYTES &&
			chunkSize <= MAX_CHUNK_BYTES &&
			finalChunkSize >= MIN_CHUNK_BYTES &&
			finalChunkSize <= MAX_FINAL_CHUNK_BYTES
		) {
			return {
				chunkSize,
				totalChunkCount,
			};
		}

		totalChunkCount += 1;
	}

	throw new Error("Unable to compute a valid TikTok upload chunk plan.");
}

export function normalizeMimeType(mimeType) {
	const normalized = ensureString(mimeType).trim().toLowerCase();
	const allowedTypes = ["video/mp4", "video/quicktime", "video/webm"];

	if (!normalized) {
		return "video/mp4";
	}

	if (!allowedTypes.includes(normalized)) {
		throw new Error(
			"Unsupported video type. Use MP4, MOV (QuickTime), or WebM.",
		);
	}

	return normalized;
}

export async function initInboxUpload(accessToken, { videoSize, chunkSize, totalChunkCount }) {
	const { ok, payload, status } = await requestTikTokJson(
		"https://open.tiktokapis.com/v2/post/publish/inbox/video/init/",
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json; charset=UTF-8",
			},
			body: JSON.stringify({
				source_info: {
					source: "FILE_UPLOAD",
					video_size: videoSize,
					chunk_size: chunkSize,
					total_chunk_count: totalChunkCount,
				},
			}),
		},
	);

	if (!ok || payload?.error?.code !== "ok") {
		throw new Error(
			extractTikTokErrorMessage(payload, `TikTok upload init failed (${status}).`),
		);
	}

	return payload.data;
}
