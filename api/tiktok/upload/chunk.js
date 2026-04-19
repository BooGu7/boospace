import {
	getAuthenticatedSession,
	normalizeMimeType,
	readRawBody,
	requireMethod,
	sendJson,
} from "../../_lib/tiktok.js";

export const config = {
	api: {
		bodyParser: false,
	},
};

export default async function handler(req, res) {
	if (!requireMethod(req, res, "POST")) {
		return;
	}

	const auth = await getAuthenticatedSession(req, res, {
		requiredScopes: ["video.upload"],
	});

	if (!auth) {
		return;
	}

	const uploadUrl = req.headers["x-upload-url"];
	const start = Number(req.headers["x-upload-start"]);
	const end = Number(req.headers["x-upload-end"]);
	const total = Number(req.headers["x-upload-total"]);
	const mimeType = normalizeMimeType(req.headers["x-upload-mime-type"]);

	if (
		typeof uploadUrl !== "string" ||
		!uploadUrl.startsWith("https://") ||
		!Number.isFinite(start) ||
		!Number.isFinite(end) ||
		!Number.isFinite(total)
	) {
		sendJson(res, 400, {
			ok: false,
			error: "Invalid TikTok upload chunk metadata.",
		});
		return;
	}

	try {
		const rawBody = await readRawBody(req);
		const response = await fetch(uploadUrl, {
			method: "PUT",
			headers: {
				"Content-Length": String(rawBody.byteLength),
				"Content-Range": `bytes ${start}-${end}/${total}`,
				"Content-Type": mimeType,
			},
			body: rawBody,
		});

		if (!response.ok) {
			const responseText = await response.text();
			sendJson(res, response.status, {
				ok: false,
				error: responseText || "TikTok upload chunk failed.",
			});
			return;
		}

		sendJson(res, 200, {
			ok: true,
			status: response.status,
			bytesSent: rawBody.byteLength,
		});
	} catch (error) {
		sendJson(res, 500, {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Unable to proxy TikTok upload chunk.",
		});
	}
}
