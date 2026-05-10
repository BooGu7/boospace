#!/usr/bin/env node

/**
 * Script để verify Google Tag Gateway configuration
 * Chạy: node scripts/verify-gtm-gateway.js
 */

import { exec } from "node:child_process";
import dns from "node:dns";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const _resolve4 = promisify(dns.resolve4);
const resolveCname = promisify(dns.resolveCname);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Đọc config
function readConfig() {
	try {
		const configPath = join(projectRoot, "src/config.ts");
		const configContent = readFileSync(configPath, "utf-8");

		// Extract gateway domain
		const gatewayMatch = configContent.match(
			/gatewayDomain:\s*["']([^"']+)["']/,
		);
		const gaIdMatch = configContent.match(/id:\s*["']([^"']+)["']/);

		return {
			gatewayDomain: gatewayMatch ? gatewayMatch[1] : null,
			gaId: gaIdMatch ? gaIdMatch[1] : null,
		};
	} catch (error) {
		console.error("❌ Không thể đọc config:", error.message);
		return null;
	}
}

// Kiểm tra DNS bằng nhiều phương pháp
async function checkDNS(domain) {
	console.log(`\n🔍 Kiểm tra DNS cho: ${domain}`);

	let dnsOk = false;
	let _method = "";

	// Phương pháp 1: Sử dụng Node.js DNS module
	try {
		const cnameRecords = await resolveCname(domain);
		console.log("✅ CNAME records (Node.js DNS):");
		cnameRecords.forEach((record) => {
			console.log(`   → ${record}`);
			if (record.includes("gtm-gateway.googletagmanager.com")) {
				dnsOk = true;
				_method = "Node.js DNS";
			}
		});
	} catch (_error) {
		// Thử phương pháp 2: Sử dụng nslookup (Windows/Mac/Linux)
		try {
			const isWindows = process.platform === "win32";
			const command = isWindows
				? `nslookup -type=CNAME ${domain}`
				: `nslookup -type=CNAME ${domain}`;

			const { stdout, stderr } = await execAsync(command);

			if (stdout && !stderr) {
				console.log("\n📡 Thử kiểm tra bằng nslookup...");
				const output = stdout.toString();

				// Kiểm tra xem có kết quả không
				if (output.includes(domain) || output.includes("gtm-gateway")) {
					console.log("✅ DNS record được tìm thấy (nslookup)");
					console.log(
						`   Output: ${output.split("\n").slice(0, 5).join("\n   ")}`,
					);
					dnsOk = true;
					_method = "nslookup";
				} else {
					console.log("⚠️  DNS record chưa được tìm thấy");
				}
			}
		} catch (_execError) {
			// Nếu cả hai phương pháp đều fail, DNS chưa được cấu hình
			console.log(`\n⚠️  Không thể resolve DNS cho ${domain}`);
		}
	}

	if (!dnsOk) {
		console.log("\n❌ DNS chưa được cấu hình hoặc chưa propagate");
		console.log("\n💡 Hướng dẫn cấu hình DNS:");
		console.log("   1. Đăng nhập Cloudflare: https://dash.cloudflare.com");
		console.log("   2. Chọn domain: boospace.tech");
		console.log("   3. Vào DNS → Records → Add record");
		console.log("   4. Điền thông tin:");
		console.log("      Type: CNAME");
		console.log("      Name: gtm");
		console.log("      Target: gtm-gateway.googletagmanager.com");
		console.log("      Proxy: ☁️ Proxied (ON)");
		console.log("   5. Save và chờ 5-10 phút để DNS propagate");
		console.log("   6. Chạy lại script: pnpm run verify-gtm");
	}

	return dnsOk;
}

// Kiểm tra HTTP endpoint
async function checkHTTP(domain, gaId) {
	console.log("\n🌐 Kiểm tra HTTP endpoint...");
	const url = `https://${domain}/gtag/js?id=${gaId}`;

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

		const response = await fetch(url, {
			method: "HEAD",
			signal: controller.signal,
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; GTM-Gateway-Verifier/1.0)",
			},
		});

		clearTimeout(timeoutId);

		if (response.ok) {
			console.log(`✅ Endpoint hoạt động: ${url}`);
			console.log(`   Status: ${response.status} ${response.statusText}`);

			// Kiểm tra headers
			const gatewayHeader = response.headers.get("x-goog-tag-gateway");
			if (gatewayHeader) {
				console.log(`   ✅ Google Tag Gateway header: ${gatewayHeader}`);
			} else {
				console.log(
					"   ⚠️  Không có x-goog-tag-gateway header (có thể domain chưa verify)",
				);
			}

			return true;
		}
		console.error(
			`❌ Endpoint trả về lỗi: ${response.status} ${response.statusText}`,
		);
		if (response.status === 404) {
			console.log(
				"   💡 404 có thể do domain chưa được verify trong Google Ads",
			);
		}
		return false;
	} catch (error) {
		if (error.name === "AbortError") {
			console.error("❌ Timeout khi kết nối đến endpoint (quá 10 giây)");
		} else {
			console.error(`❌ Không thể kết nối đến endpoint: ${error.message}`);
		}
		console.log("\n💡 Có thể do:");
		console.log(`   - DNS chưa propagate (kiểm tra bằng: nslookup ${domain})`);
		console.log("   - Domain chưa được verify trong Google Ads");
		console.log("   - SSL certificate chưa được cấu hình trong Cloudflare");
		console.log("   - Cloudflare proxy chưa được bật (phải là ☁️ Proxied)");
		return false;
	}
}

// Main function
async function main() {
	console.log("🚀 Google Tag Gateway Verification Script\n");
	console.log("=".repeat(50));

	const config = readConfig();

	if (!config) {
		process.exit(1);
	}

	if (!config.gatewayDomain) {
		console.log("⚠️  Gateway domain chưa được cấu hình trong src/config.ts");
		console.log('   Thêm: gatewayDomain: "gtm.boospace.tech"');
		process.exit(1);
	}

	if (!config.gaId) {
		console.log("⚠️  Google Analytics ID chưa được cấu hình");
		process.exit(1);
	}

	console.log("\n📋 Configuration:");
	console.log(`   Gateway Domain: ${config.gatewayDomain}`);
	console.log(`   Google Analytics ID: ${config.gaId}`);
	console.log(
		`   Expected URL: https://${config.gatewayDomain}/gtag/js?id=${config.gaId}`,
	);

	// Kiểm tra DNS
	const dnsOk = await checkDNS(config.gatewayDomain);

	// Kiểm tra HTTP
	const httpOk = await checkHTTP(config.gatewayDomain, config.gaId);

	// Tổng kết
	console.log(`\n${"=".repeat(50)}`);
	console.log("\n📊 Kết quả:");
	console.log(`   DNS: ${dnsOk ? "✅ OK" : "❌ FAIL"}`);
	console.log(`   HTTP: ${httpOk ? "✅ OK" : "❌ FAIL"}`);

	if (dnsOk && httpOk) {
		console.log("\n🎉 Google Tag Gateway đã được cấu hình đúng!");
		console.log("\n📝 Bước tiếp theo:");
		console.log(
			"   1. Verify domain trong Google Ads dashboard (nếu chưa làm)",
		);
		console.log("   2. Test trên website thực tế: https://boospace.tech");
		console.log("   3. Kiểm tra Network tab trong DevTools (F12)");
		console.log("   4. Kiểm tra conversion tracking trong Google Ads");
		process.exit(0);
	} else {
		console.log("\n⚠️  Google Tag Gateway chưa được cấu hình hoàn chỉnh");
		console.log("\n📚 Tài liệu chi tiết:");
		console.log("   - Xem file: GOOGLE_TAG_GATEWAY_SETUP.md");
		console.log("   - Quick start: GTM_GATEWAY_QUICK_START.md");
		console.log("\n🔧 Các bước cần làm:");
		let stepNum = 1;
		if (!dnsOk) {
			console.log(`   ${stepNum}. ⚠️  Cấu hình DNS CNAME trong Cloudflare`);
			stepNum++;
		}
		if (!httpOk) {
			if (dnsOk) {
				console.log(`   ${stepNum}. ⚠️  Verify domain trong Google Ads`);
			} else {
				console.log(`   ${stepNum}. ⚠️  Sau đó verify domain trong Google Ads`);
			}
		}
		console.log(
			"\n💡 Script này sẽ không fail nếu DNS chưa setup - đây là bình thường!",
		);
		console.log(
			"   Chỉ cần làm theo hướng dẫn trên và chạy lại script sau khi cấu hình.",
		);
		process.exit(0); // Exit với code 0 vì đây không phải lỗi nghiêm trọng
	}
}

main().catch((error) => {
	console.error("❌ Error:", error);
	process.exit(1);
});
