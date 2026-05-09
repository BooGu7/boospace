<script lang="ts">
import Icon from "@iconify/svelte";
import { onMount } from "svelte";

type TikTokUser = {
	openId: string;
	displayName: string;
	avatarUrl: string;
};

type SessionResponse = {
	ok: boolean;
	configured: boolean;
	missingConfig?: string[];
	authenticated: boolean;
	requestedScopes?: string[];
	grantedScopes?: string[];
	user?: TikTokUser;
	error?: string;
};

type UploadInitResponse = {
	ok: boolean;
	error?: string;
	upload?: {
		fileName: string;
		fileSize: number;
		mimeType: string;
		chunkSize: number;
		totalChunkCount: number;
		publishId: string;
		uploadUrl: string;
	};
};

let booting = true;
let configured = false;
let authenticated = false;
let missingConfig: string[] = [];
let requestedScopes: string[] = [];
let grantedScopes: string[] = [];
let sessionError = "";
let user: TikTokUser | null = null;

let selectedFile: File | null = null;
let uploadState: "idle" | "uploading" | "success" | "error" = "idle";
let uploadProgress = 0;
let uploadMessage = "";
let publishId = "";
let uploadBusy = false;
let canUpload = false;

const loginPath = "/api/tiktok/login?returnTo=/login/";

function formatBytes(value: number) {
	if (!Number.isFinite(value) || value <= 0) {
		return "0 B";
	}

	const units = ["B", "KB", "MB", "GB"];
	let size = value;
	let unitIndex = 0;

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex += 1;
	}

	return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

async function loadSession() {
	booting = true;
	sessionError = "";

	try {
		const response = await fetch("/api/tiktok/me", {
			credentials: "same-origin",
		});
		const payload = (await response.json()) as SessionResponse;

		configured = payload.configured;
		authenticated = payload.authenticated;
		missingConfig = payload.missingConfig || [];
		requestedScopes = payload.requestedScopes || [];
		grantedScopes = payload.grantedScopes || [];
		user = payload.user || null;
		sessionError = payload.error || "";
	} catch (error) {
		sessionError =
			error instanceof Error
				? error.message
				: "Unable to load the TikTok session.";
	} finally {
		booting = false;
	}
}

function normalizeUrlMessage() {
	const currentUrl = new URL(window.location.href);
	const successFlag = currentUrl.searchParams.get("tiktok");
	const errorMessage = currentUrl.searchParams.get("tiktok_error");

	if (successFlag === "connected") {
		uploadMessage = "TikTok authorization complete. Session connected.";
	}

	if (errorMessage) {
		sessionError = errorMessage;
	}

	if (successFlag || errorMessage) {
		currentUrl.searchParams.delete("tiktok");
		currentUrl.searchParams.delete("tiktok_error");
		window.history.replaceState(
			{},
			"",
			currentUrl.pathname + currentUrl.search,
		);
	}
}

onMount(async () => {
	normalizeUrlMessage();
	await loadSession();
});

function startLogin() {
	window.location.href = loginPath;
}

async function logout() {
	await fetch("/api/tiktok/logout", {
		method: "POST",
		credentials: "same-origin",
	});

	selectedFile = null;
	uploadState = "idle";
	uploadProgress = 0;
	uploadMessage = "";
	publishId = "";

	await loadSession();
}

function onFileSelected(event: Event) {
	const input = event.currentTarget as HTMLInputElement;
	selectedFile = input.files?.[0] || null;
	uploadState = "idle";
	uploadProgress = 0;
	uploadMessage = selectedFile ? `${selectedFile.name} ready to upload.` : "";
	publishId = "";
}

async function uploadVideo() {
	if (!selectedFile || uploadBusy) {
		return;
	}

	uploadBusy = true;
	uploadState = "uploading";
	uploadProgress = 0;
	uploadMessage = "Preparing TikTok upload session...";
	publishId = "";

	try {
		const initResponse = await fetch("/api/tiktok/upload/init", {
			method: "POST",
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				fileName: selectedFile.name,
				fileSize: selectedFile.size,
				mimeType: selectedFile.type || "video/mp4",
			}),
		});

		const initPayload = (await initResponse.json()) as UploadInitResponse;

		if (!initResponse.ok || !initPayload.ok || !initPayload.upload) {
			throw new Error(initPayload.error || "TikTok upload init failed.");
		}

		const { upload } = initPayload;
		const chunkSize = upload.chunkSize;
		const totalSize = selectedFile.size;

		for (let start = 0; start < totalSize; start += chunkSize) {
			const endExclusive = Math.min(start + chunkSize, totalSize);
			const chunk = selectedFile.slice(start, endExclusive);
			const rawChunk = await chunk.arrayBuffer();

			uploadMessage = `Uploading ${Math.floor(start / chunkSize) + 1}/${upload.totalChunkCount}...`;

			const chunkResponse = await fetch("/api/tiktok/upload/chunk", {
				method: "POST",
				credentials: "same-origin",
				headers: {
					"Content-Type": "application/octet-stream",
					"X-Upload-End": String(endExclusive - 1),
					"X-Upload-Mime-Type": upload.mimeType,
					"X-Upload-Start": String(start),
					"X-Upload-Total": String(totalSize),
					"X-Upload-Url": upload.uploadUrl,
				},
				body: rawChunk,
			});

			const chunkPayload = await chunkResponse.json();

			if (!chunkResponse.ok || !chunkPayload.ok) {
				throw new Error(chunkPayload.error || "TikTok upload chunk failed.");
			}

			uploadProgress = Math.round((endExclusive / totalSize) * 100);
		}

		uploadState = "success";
		publishId = upload.publishId;
		uploadMessage =
			"Upload complete. TikTok created a draft flow in the creator inbox.";
	} catch (error) {
		uploadState = "error";
		uploadMessage =
			error instanceof Error ? error.message : "TikTok upload failed.";
	} finally {
		uploadBusy = false;
	}
}

$: canUpload = configured && authenticated && selectedFile && !uploadBusy;
</script>

<div class="console-shell">
	<section class="console-hero">
		<div class="console-copy">
			<div class="eyebrow">TikTok Login + Upload</div>
			<h1>Connect a TikTok account, read identity, and upload a draft video from one page.</h1>
			<p>
				This flow is wired for TikTok OAuth, Display API profile fetch, and Content Posting draft uploads.
			</p>
		</div>

		<div class="console-steps" aria-label="TikTok flow steps">
			<div>
				<span>01</span>
				<strong>Open `/login`</strong>
			</div>
			<div>
				<span>02</span>
				<strong>Authorize with TikTok</strong>
			</div>
			<div>
				<span>03</span>
				<strong>Load identity</strong>
			</div>
			<div>
				<span>04</span>
				<strong>Upload video draft</strong>
			</div>
		</div>
	</section>

	<div class="surface-grid">
		<section class="surface-panel">
			<div class="section-head">
				<div>
					<div class="label">Connection</div>
					<h2>Login with TikTok</h2>
				</div>
				<div class="status-dot" class:ready={authenticated}></div>
			</div>

			<p class="muted">
				Clicking the button redirects the user to TikTok authorization and returns to this page after consent.
			</p>

			<div class="cta-row">
				<button class="cta-primary" on:click={startLogin} disabled={!configured}>
					<Icon icon="fa6-brands:tiktok" />
					Login with TikTok
				</button>

				{#if authenticated}
					<button class="cta-secondary" on:click={logout}>
						Disconnect
					</button>
				{/if}
			</div>

			{#if booting}
				<p class="status-line">Checking TikTok session...</p>
			{:else if !configured}
				<div class="message-block warning">
					<strong>Missing server configuration</strong>
					<p>{missingConfig.join(", ")}</p>
				</div>
			{:else if sessionError}
				<div class="message-block danger">
					<strong>Session issue</strong>
					<p>{sessionError}</p>
				</div>
			{:else if authenticated}
				<div class="message-block success">
					<strong>TikTok authorization active</strong>
					<p>The browser came back from TikTok and the session cookie is ready.</p>
				</div>
			{:else}
				<div class="message-block neutral">
					<strong>Waiting for login</strong>
					<p>The authorize screen will open on TikTok and return here after consent.</p>
				</div>
			{/if}
		</section>

		<section class="surface-panel identity-panel">
			<div class="section-head">
				<div>
					<div class="label">Identity proof</div>
					<h2>User profile</h2>
				</div>
			</div>

			{#if authenticated && user}
				<div class="identity-block">
					<img src={user.avatarUrl} alt={user.displayName} class="avatar" />
					<div>
						<div class="identity-name">{user.displayName}</div>
						<div class="identity-meta">{user.openId}</div>
					</div>
				</div>
			{:else}
				<div class="identity-placeholder">
					<Icon icon="material-symbols:account-circle-outline-rounded" />
					<span>No TikTok user loaded yet.</span>
				</div>
			{/if}

			<div class="proof-list">
				<div>
					<span>Requested scopes</span>
					<div class="badge-row">
						{#each requestedScopes as scope}
							<code>{scope}</code>
						{/each}
					</div>
				</div>
				<div>
					<span>Granted scopes</span>
					<div class="badge-row">
						{#if grantedScopes.length > 0}
							{#each grantedScopes as scope}
								<code class="granted">{scope}</code>
							{/each}
						{:else}
							<em>Connect first</em>
						{/if}
					</div>
				</div>
			</div>

			<p class="tiny-note">
				`user.info.basic` proves avatar and display name. TikTok no longer returns `username` under this scope; `username` requires `user.info.profile`.
			</p>
		</section>
	</div>

	<section class="surface-panel upload-panel">
		<div class="section-head">
			<div>
				<div class="label">Content Posting API</div>
				<h2>Upload a draft video</h2>
			</div>
			<div class="upload-proof">Scope: <code>video.upload</code></div>
		</div>

		<div class="upload-layout">
			<div class="upload-input">
				<label for="video-file">Choose video</label>
				<input
					id="video-file"
					type="file"
					accept="video/mp4,video/quicktime,video/webm"
					on:change={onFileSelected}
					disabled={!authenticated}
				/>

				{#if selectedFile}
					<div class="file-meta">
						<strong>{selectedFile.name}</strong>
						<span>{formatBytes(selectedFile.size)}</span>
					</div>
				{:else}
					<p class="muted">Accepted: MP4, MOV, WebM. TikTok draft upload uses chunked transfer.</p>
				{/if}
			</div>

			<div class="upload-actions">
				<button class="cta-primary" on:click={uploadVideo} disabled={!canUpload}>
					<Icon icon="material-symbols:cloud-upload-outline-rounded" />
					{uploadBusy ? "Uploading..." : "Upload video"}
				</button>
			</div>
		</div>

		<div class="progress-shell" class:visible={uploadState !== "idle"}>
			<div class="progress-track">
				<div class="progress-bar" style={`width:${uploadProgress}%`}></div>
			</div>
			<div class="progress-meta">
				<span>{uploadMessage || "No upload started."}</span>
				<strong>{uploadProgress}%</strong>
			</div>
		</div>

		{#if uploadState === "success"}
			<div class="message-block success">
				<strong>Upload success</strong>
				<p>Publish ID: {publishId}</p>
			</div>
		{:else if uploadState === "error"}
			<div class="message-block danger">
				<strong>Upload failed</strong>
				<p>{uploadMessage}</p>
			</div>
		{/if}
	</section>
</div>

<style>
	.console-shell {
		display: grid;
		gap: 1.25rem;
	}

	.console-hero {
		position: relative;
		overflow: hidden;
		border-radius: 1.5rem;
		padding: 1.5rem;
		background:
			radial-gradient(circle at top right, rgba(255, 0, 80, 0.16), transparent 35%),
			linear-gradient(135deg, rgba(0, 0, 0, 0.92), rgba(30, 30, 30, 0.86));
		color: white;
		display: grid;
		gap: 1.5rem;
	}

	.console-copy {
		max-width: 46rem;
	}

	.eyebrow {
		font-size: 0.8rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		opacity: 0.7;
		margin-bottom: 0.75rem;
	}

	h1 {
		margin: 0;
		font-size: clamp(2rem, 4vw, 3.6rem);
		line-height: 1.02;
		font-weight: 800;
	}

	h2 {
		margin: 0.2rem 0 0;
		font-size: 1.3rem;
		font-weight: 700;
		color: rgba(0, 0, 0, 0.9);
	}

	:global(.dark) h2 {
		color: rgba(255, 255, 255, 0.92);
	}

	.console-copy p {
		margin: 0.9rem 0 0;
		max-width: 38rem;
		font-size: 1rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.82);
	}

	.console-steps {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.console-steps div {
		padding-top: 0.9rem;
		border-top: 1px solid rgba(255, 255, 255, 0.16);
		display: grid;
		gap: 0.35rem;
	}

	.console-steps span {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.55);
	}

	.console-steps strong {
		font-size: 0.96rem;
		font-weight: 700;
	}

	.surface-grid {
		display: grid;
		grid-template-columns: 1.1fr 0.9fr;
		gap: 1rem;
	}

	.surface-panel {
		border-radius: 1.3rem;
		padding: 1.25rem;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.96));
		border: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow: 0 16px 50px rgba(17, 24, 39, 0.08);
	}

	:global(.dark) .surface-panel {
		background: linear-gradient(180deg, rgba(32, 32, 34, 0.92), rgba(24, 24, 26, 0.96));
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow: none;
	}

	.section-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.label {
		font-size: 0.76rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--primary);
	}

	.status-dot {
		width: 0.8rem;
		height: 0.8rem;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.14);
		margin-top: 0.4rem;
	}

	.status-dot.ready {
		background: oklch(0.74 0.16 160);
		box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.12);
	}

	.muted {
		margin: 0;
		color: rgba(0, 0, 0, 0.58);
		line-height: 1.6;
	}

	:global(.dark) .muted {
		color: rgba(255, 255, 255, 0.62);
	}

	.cta-row,
	.upload-layout {
		display: flex;
		gap: 0.85rem;
		flex-wrap: wrap;
		align-items: center;
	}

	.cta-row {
		margin-top: 1rem;
	}

	.cta-primary,
	.cta-secondary {
		border: 0;
		border-radius: 999px;
		padding: 0.9rem 1.2rem;
		font-weight: 700;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		cursor: pointer;
		transition: transform 160ms ease, opacity 160ms ease, background 160ms ease;
	}

	.cta-primary {
		background: linear-gradient(135deg, rgb(255, 0, 80), rgb(37, 244, 238));
		color: rgb(10, 10, 11);
	}

	.cta-secondary {
		background: rgba(0, 0, 0, 0.06);
		color: rgba(0, 0, 0, 0.76);
	}

	:global(.dark) .cta-secondary {
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.82);
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}

	.status-line {
		margin: 1rem 0 0;
		font-size: 0.95rem;
		color: rgba(0, 0, 0, 0.6);
	}

	:global(.dark) .status-line {
		color: rgba(255, 255, 255, 0.62);
	}

	.message-block {
		margin-top: 1rem;
		padding: 0.95rem 1rem;
		border-radius: 1rem;
		display: grid;
		gap: 0.25rem;
	}

	.message-block strong {
		font-size: 0.96rem;
	}

	.message-block p {
		margin: 0;
		line-height: 1.5;
	}

	.neutral {
		background: rgba(0, 0, 0, 0.04);
	}

	.warning {
		background: rgba(234, 179, 8, 0.14);
	}

	.success {
		background: rgba(34, 197, 94, 0.14);
	}

	.danger {
		background: rgba(239, 68, 68, 0.14);
	}

	.identity-block {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
	}

	.avatar {
		width: 4rem;
		height: 4rem;
		border-radius: 999px;
		object-fit: cover;
		background: rgba(0, 0, 0, 0.08);
	}

	.identity-name {
		font-size: 1.2rem;
		font-weight: 800;
	}

	.identity-meta {
		font-size: 0.88rem;
		color: rgba(0, 0, 0, 0.48);
		word-break: break-all;
	}

	:global(.dark) .identity-meta {
		color: rgba(255, 255, 255, 0.48);
	}

	.identity-placeholder {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 1rem 0;
		color: rgba(0, 0, 0, 0.58);
	}

	:global(.dark) .identity-placeholder {
		color: rgba(255, 255, 255, 0.6);
	}

	.identity-placeholder :global(svg) {
		font-size: 1.8rem;
	}

	.proof-list {
		display: grid;
		gap: 0.85rem;
	}

	.proof-list span,
	.upload-proof {
		font-size: 0.8rem;
		font-weight: 700;
		color: rgba(0, 0, 0, 0.56);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	:global(.dark) .proof-list span,
	:global(.dark) .upload-proof {
		color: rgba(255, 255, 255, 0.58);
	}

	.badge-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin-top: 0.45rem;
	}

	code {
		font-family: "JetBrains Mono Variable", monospace;
		font-size: 0.83rem;
		padding: 0.3rem 0.5rem;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.06);
	}

	:global(.dark) code {
		background: rgba(255, 255, 255, 0.08);
	}

	code.granted {
		background: rgba(34, 197, 94, 0.12);
	}

	.tiny-note {
		margin: 1rem 0 0;
		font-size: 0.88rem;
		line-height: 1.6;
		color: rgba(0, 0, 0, 0.56);
	}

	:global(.dark) .tiny-note {
		color: rgba(255, 255, 255, 0.58);
	}

	.upload-panel {
		display: grid;
		gap: 1rem;
	}

	.upload-input {
		flex: 1 1 24rem;
		display: grid;
		gap: 0.55rem;
	}

	.upload-input label {
		font-size: 0.88rem;
		font-weight: 700;
	}

	input[type="file"] {
		width: 100%;
		border-radius: 0.95rem;
		padding: 0.9rem;
		border: 1px dashed rgba(0, 0, 0, 0.2);
		background: rgba(0, 0, 0, 0.02);
	}

	:global(.dark) input[type="file"] {
		border-color: rgba(255, 255, 255, 0.16);
		background: rgba(255, 255, 255, 0.03);
	}

	.file-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.92rem;
	}

	.progress-shell {
		display: none;
		gap: 0.65rem;
	}

	.progress-shell.visible {
		display: grid;
	}

	.progress-track {
		width: 100%;
		height: 0.7rem;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.08);
		overflow: hidden;
	}

	:global(.dark) .progress-track {
		background: rgba(255, 255, 255, 0.08);
	}

	.progress-bar {
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, rgb(255, 0, 80), rgb(37, 244, 238));
		transition: width 180ms ease;
	}

	.progress-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.92rem;
	}

	@media (max-width: 900px) {
		.console-steps,
		.surface-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
