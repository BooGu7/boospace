import {
	appendSetCookie,
	createChunkPlan,
	createSessionCookie,
	getAuthenticatedSession,
	initInboxUpload,
	normalizeMimeType,
	readJsonBody,
	requireMethod,
	sendJson,
} from "../../_lib/tiktok.js";

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

	const { config, session } = auth;

	try {
		const body = await readJsonBody(req);
		const fileSize = Number(body.fileSize || 0);
		const fileName = typeof body.fileName === "string" ? body.fileName : "video";
		const mimeType = normalizeMimeType(body.mimeType);
		const chunkPlan = createChunkPlan(fileSize);
		const uploadData = await initInboxUpload(session.accessToken, {
			videoSize: fileSize,
			chunkSize: chunkPlan.chunkSize,
			totalChunkCount: chunkPlan.totalChunkCount,
		});

		appendSetCookie(res, createSessionCookie(session, config.sessionSecret));
		sendJson(res, 200, {
			ok: true,
			upload: {
				fileName,
				fileSize,
				mimeType,
				chunkSize: chunkPlan.chunkSize,
				totalChunkCount: chunkPlan.totalChunkCount,
				publishId: uploadData.publish_id,
				uploadUrl: uploadData.upload_url,
			},
		});
	} catch (error) {
		sendJson(res, 400, {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: "Unable to initialize TikTok upload.",
		});
	}
}
