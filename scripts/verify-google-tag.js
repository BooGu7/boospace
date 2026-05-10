#!/usr/bin/env node

/**
 * Script để verify Google Tag configuration và HTML output
 * Chạy: pnpm run verify-tag
 *
 * Script này sẽ kiểm tra:
 * 1. Config file có đúng không
 * 2. HTML output có chứa tag đúng không (sau khi build)
 * 3. Production website có tag không
 * 4. Tag có thể load được không
 */

import { existsSync, readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Colors for console output
const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
};

function log(message, color = "reset") {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
	console.log(`\n${colors.cyan}${"=".repeat(60)}${colors.reset}`);
	log(`  ${title}`, "bright");
	console.log(`${colors.cyan}${"=".repeat(60)}${colors.reset}\n`);
}

function logSuccess(message) {
	log(`✅ ${message}`, "green");
}

function logError(message) {
	log(`❌ ${message}`, "red");
}

function logWarning(message) {
	log(`⚠️  ${message}`, "yellow");
}

function logInfo(message) {
	log(`ℹ️  ${message}`, "blue");
}

// Đọc config từ file
function readConfig() {
	try {
		const configPath = join(projectRoot, "src/config.ts");
		const configContent = readFileSync(configPath, "utf-8");

		// Extract Google Analytics config
		const gaIdMatch = configContent.match(
			/googleAnalytics:\s*\{[^}]*id:\s*["']([^"']+)["']/s,
		);
		const gatewayMatch = configContent.match(
			/gatewayDomain:\s*["']([^"']*)["']/,
		);
		const gtmIdMatch = configContent.match(
			/googleTagManager:\s*\{[^}]*id:\s*["']([^"']+)["']/s,
		);

		const gaId = gaIdMatch ? gaIdMatch[1] : null;
		const gatewayDomain = gatewayMatch?.[1] ? gatewayMatch[1] : "";
		const gtmId = gtmIdMatch ? gtmIdMatch[1] : null;

		return {
			gaId,
			gatewayDomain,
			gtmId,
		};
	} catch (error) {
		logError(`Không thể đọc config: ${error.message}`);
		return null;
	}
}

// Kiểm tra config file
function checkConfig(config) {
	logSection("1. Kiểm tra Config File");

	let allOk = true;

	if (!config.gaId) {
		logError("Google Analytics ID chưa được cấu hình");
		allOk = false;
	} else {
		logSuccess(`Google Analytics ID: ${config.gaId}`);

		// Kiểm tra format ID
		if (config.gaId.startsWith("AW-")) {
			logInfo("Đây là Google Ads Conversion ID (AW-xxx)");
		} else if (config.gaId.startsWith("G-")) {
			logInfo("Đây là Google Analytics 4 ID (G-xxx)");
		} else {
			logWarning("ID format không chuẩn. Thường là G-xxx hoặc AW-xxx");
		}
	}

	if (config.gatewayDomain) {
		logSuccess(`Gateway Domain: ${config.gatewayDomain}`);
		logInfo("Gateway domain đã được cấu hình");
	} else {
		logWarning("Gateway Domain: chưa cấu hình (sẽ dùng googletagmanager.com)");
		logInfo('Nếu muốn dùng gateway, thêm: gatewayDomain: "gtm.boospace.tech"');
	}

	if (config.gtmId) {
		logSuccess(`Google Tag Manager ID: ${config.gtmId}`);
	} else {
		logWarning("Google Tag Manager ID chưa được cấu hình");
	}

	return allOk;
}

// Tìm file HTML trong dist folder
async function findHTMLFiles() {
	const distPath = join(projectRoot, "dist");

	if (!existsSync(distPath)) {
		return [];
	}

	const htmlFiles = [];

	async function findInDir(dir) {
		try {
			const entries = await readdir(dir, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = join(dir, entry.name);

				if (entry.isDirectory()) {
					await findInDir(fullPath);
				} else if (entry.isFile() && entry.name.endsWith(".html")) {
					htmlFiles.push(fullPath);
				}
			}
		} catch (_error) {
			// Ignore errors
		}
	}

	await findInDir(distPath);
	return htmlFiles;
}

// Kiểm tra HTML files có chứa tag đúng không
function checkHTMLFiles(htmlFiles, config) {
	logSection("2. Kiểm tra HTML Output (sau build)");

	if (htmlFiles.length === 0) {
		logWarning("Không tìm thấy file HTML trong dist/");
		logInfo("💡 Chạy lệnh: pnpm run build");
		return false;
	}

	logSuccess(`Tìm thấy ${htmlFiles.length} file HTML`);

	// Chỉ kiểm tra file index.html hoặc file đầu tiên
	const mainFile =
		htmlFiles.find((f) => f.includes("index.html")) || htmlFiles[0];
	logInfo(`Kiểm tra file: ${mainFile.replace(projectRoot, ".")}`);

	try {
		const htmlContent = readFileSync(mainFile, "utf-8");

		const foundIssues = [];
		const foundGood = [];

		// Kiểm tra dataLayer initialization
		if (htmlContent.includes("window.dataLayer = window.dataLayer || []")) {
			foundGood.push("dataLayer được khởi tạo");
		} else {
			foundIssues.push("Không tìm thấy khởi tạo dataLayer");
		}

		// Kiểm tra gtag function
		if (htmlContent.includes("function gtag(){dataLayer.push(arguments);}")) {
			foundGood.push("gtag function được định nghĩa");
		} else {
			foundIssues.push("Không tìm thấy gtag function");
		}

		// Kiểm tra script tag load gtag.js
		if (config.gaId) {
			const scriptTagPattern = new RegExp(
				`googletagmanager\\.com/gtag/js\\?id=${config.gaId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
				"i",
			);
			if (scriptTagPattern.test(htmlContent)) {
				foundGood.push(`Script tag load gtag.js với ID ${config.gaId}`);
			} else {
				foundIssues.push(
					`Không tìm thấy script tag load gtag.js với ID ${config.gaId}`,
				);
			}

			// Kiểm tra gtag config
			const configPattern = new RegExp(
				`gtag\\s*\\(\\s*['"]config['"]\\s*,\\s*['"]${config.gaId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}['"]`,
				"i",
			);
			if (configPattern.test(htmlContent)) {
				foundGood.push(`gtag('config', '${config.gaId}') được gọi`);
			} else {
				foundIssues.push(`Không tìm thấy gtag('config', '${config.gaId}')`);
			}
		}

		// Kiểm tra gateway domain (nếu có)
		if (config.gatewayDomain) {
			if (htmlContent.includes(config.gatewayDomain)) {
				foundGood.push(`Gateway domain ${config.gatewayDomain} được sử dụng`);
			} else {
				foundIssues.push(
					`Gateway domain ${config.gatewayDomain} không được tìm thấy trong HTML`,
				);
			}
		}

		// Kiểm tra script tag có trong <head> không
		const headMatch = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
		if (headMatch) {
			const headContent = headMatch[1];
			if (
				headContent.includes("googletagmanager.com") ||
				headContent.includes("gtag")
			) {
				foundGood.push("Tag được đặt trong <head>");
			} else {
				foundIssues.push("Tag không được tìm thấy trong <head>");
			}
		}

		// Hiển thị kết quả
		foundGood.forEach((item) => logSuccess(item));
		foundIssues.forEach((item) => logError(item));

		return foundIssues.length === 0;
	} catch (error) {
		logError(`Không thể đọc file HTML: ${error.message}`);
		return false;
	}
}

// Kiểm tra production website
async function checkProductionWebsite(config) {
	logSection("3. Kiểm tra Production Website");

	const siteUrl = "https://boospace.tech";
	logInfo(`Đang kiểm tra: ${siteUrl}`);

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

		const response = await fetch(siteUrl, {
			method: "GET",
			signal: controller.signal,
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; Google-Tag-Verifier/1.0)",
			},
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			logError(`Website trả về lỗi: ${response.status} ${response.statusText}`);
			logInfo("💡 Kiểm tra website có đang hoạt động không");
			return false;
		}

		logSuccess(`Website đang hoạt động (${response.status})`);

		const htmlContent = await response.text();

		const foundIssues = [];
		const foundGood = [];

		// Kiểm tra tag trong HTML
		if (config.gaId) {
			if (htmlContent.includes(config.gaId)) {
				foundGood.push(`Tìm thấy ID ${config.gaId} trong HTML`);
			} else {
				foundIssues.push(`Không tìm thấy ID ${config.gaId} trong HTML`);
			}

			if (htmlContent.includes("googletagmanager.com/gtag/js")) {
				foundGood.push("Tìm thấy script tag load gtag.js");
			} else {
				foundIssues.push("Không tìm thấy script tag load gtag.js");
			}

			if (htmlContent.includes("dataLayer")) {
				foundGood.push("Tìm thấy dataLayer trong HTML");
			} else {
				foundIssues.push("Không tìm thấy dataLayer trong HTML");
			}
		}

		foundGood.forEach((item) => logSuccess(item));
		foundIssues.forEach((item) => logError(item));

		return foundIssues.length === 0;
	} catch (error) {
		if (error.name === "AbortError") {
			logError("Timeout khi kết nối đến website (quá 10 giây)");
		} else {
			logError(`Không thể kết nối đến website: ${error.message}`);
		}
		logInfo("💡 Kiểm tra website có đang online không");
		return false;
	}
}

// Kiểm tra tag có thể load được không
async function checkTagEndpoint(config) {
	logSection("4. Kiểm tra Tag Endpoint");

	if (!config.gaId) {
		logWarning("Không có GA ID để kiểm tra");
		return false;
	}

	const domain = config.gatewayDomain || "www.googletagmanager.com";
	const url = `https://${domain}/gtag/js?id=${config.gaId}`;

	logInfo(`Đang kiểm tra: ${url}`);

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000);

		const response = await fetch(url, {
			method: "HEAD",
			signal: controller.signal,
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; Google-Tag-Verifier/1.0)",
			},
		});

		clearTimeout(timeoutId);

		if (response.ok) {
			logSuccess(
				`Endpoint hoạt động: ${response.status} ${response.statusText}`,
			);

			if (config.gatewayDomain) {
				const gatewayHeader = response.headers.get("x-goog-tag-gateway");
				if (gatewayHeader) {
					logSuccess(`Google Tag Gateway header: ${gatewayHeader}`);
				} else {
					logWarning(
						"Không có x-goog-tag-gateway header (có thể domain chưa verify)",
					);
				}
			}

			return true;
		}
		logError(`Endpoint trả về lỗi: ${response.status} ${response.statusText}`);
		if (response.status === 404) {
			logInfo("💡 404 có thể do ID không đúng hoặc domain chưa verify");
		}
		return false;
	} catch (error) {
		if (error.name === "AbortError") {
			logError("Timeout khi kết nối đến endpoint (quá 10 giây)");
		} else {
			logError(`Không thể kết nối đến endpoint: ${error.message}`);
		}

		if (config.gatewayDomain) {
			logInfo("💡 Nếu đang dùng gateway domain, kiểm tra:");
			logInfo("   1. DNS đã được cấu hình chưa (chạy: pnpm run verify-gtm)");
			logInfo("   2. Domain đã được verify trong Google Ads chưa");
		}

		return false;
	}
}

// In checklist debug
function printDebugChecklist(config, results) {
	logSection("📋 Checklist Debug");

	console.log("\nĐể debug Google Tag, kiểm tra các điểm sau:\n");

	console.log("1. Browser DevTools (F12):");
	console.log("   - Console tab: gõ `window.dataLayer` → Phải thấy mảng");
	console.log('   - Console tab: gõ `typeof gtag` → Phải là "function"');
	console.log('   - Network tab: Filter "gtag" → Phải thấy request 200 OK');
	console.log(
		"   - Network tab: Kiểm tra URL là:",
		`https://${config.gatewayDomain || "www.googletagmanager.com"}/gtag/js?id=${config.gaId}`,
	);

	console.log("\n2. View Page Source (Ctrl+U):");
	console.log("   - Tìm `gtag` hoặc `dataLayer`");
	console.log("   - Đảm bảo script nằm trong <head>");
	console.log(
		"   - Đảm bảo có script load:",
		`https://www.googletagmanager.com/gtag/js?id=${config.gaId}`,
	);

	console.log("\n3. Google Tag Assistant:");
	console.log("   - Cài extension: https://tagassistant.google.com/");
	console.log("   - Mở website và enable extension");
	console.log("   - Kiểm tra tag có được phát hiện không");

	if (!results.configOk) {
		console.log("\n4. Kiểm tra config.ts:");
		console.log("   - Đảm bảo googleAnalytics.id có giá trị");
		console.log("   - Rebuild: pnpm run build");
	}

	if (!results.htmlOk) {
		console.log("\n5. Kiểm tra HTML output:");
		console.log("   - Chạy: pnpm run build");
		console.log("   - Kiểm tra file dist/index.html có chứa tag không");
	}

	if (config.gatewayDomain && !results.endpointOk) {
		console.log("\n6. Nếu dùng Gateway Domain:");
		console.log("   - Chạy: pnpm run verify-gtm (kiểm tra DNS và HTTP)");
		console.log("   - Verify domain trong Google Ads dashboard");
	}

	console.log("");
}

// Main function
async function main() {
	console.clear();
	log("🚀 Google Tag Verification Script", "bright");
	log("=====================================\n", "cyan");

	const config = readConfig();

	if (!config) {
		process.exit(1);
	}

	const results = {
		configOk: false,
		htmlOk: false,
		productionOk: false,
		endpointOk: false,
	};

	// 1. Kiểm tra config
	results.configOk = checkConfig(config);

	// 2. Kiểm tra HTML files
	if (results.configOk && config.gaId) {
		const htmlFiles = await findHTMLFiles();
		results.htmlOk = checkHTMLFiles(htmlFiles, config);
	}

	// 3. Kiểm tra production website
	if (results.configOk && config.gaId) {
		results.productionOk = await checkProductionWebsite(config);
	}

	// 4. Kiểm tra endpoint
	if (results.configOk && config.gaId) {
		results.endpointOk = await checkTagEndpoint(config);
	}

	// Tổng kết
	logSection("📊 Kết Quả Tổng Hợp");

	console.log(`Config File:     ${results.configOk ? "✅ OK" : "❌ FAIL"}`);
	console.log(
		`HTML Output:     ${results.htmlOk ? "✅ OK" : "⚠️  SKIP (chưa build hoặc không tìm thấy)"}`,
	);
	console.log(
		`Production Site: ${results.productionOk ? "✅ OK" : "⚠️  FAIL (không kết nối được hoặc thiếu tag)"}`,
	);
	console.log(`Tag Endpoint:    ${results.endpointOk ? "✅ OK" : "❌ FAIL"}`);

	const allOk = results.configOk && results.endpointOk;

	if (allOk && results.productionOk) {
		console.log(
			`\n${colors.green}${colors.bright}🎉 Google Tag đã được cấu hình đúng!${colors.reset}\n`,
		);
		console.log("✅ Tag đã sẵn sàng sử dụng");
		console.log(
			"✅ Có thể kiểm tra real-time data trong Google Analytics/Ads\n",
		);
	} else {
		console.log(
			`\n${colors.yellow}${colors.bright}⚠️  Cần kiểm tra và sửa một số vấn đề${colors.reset}\n`,
		);
		printDebugChecklist(config, results);
	}

	process.exit(allOk ? 0 : 1);
}

main().catch((error) => {
	logError(`Lỗi không mong đợi: ${error.message}`);
	if (error.stack) {
		console.error(error.stack);
	}
	process.exit(1);
});
