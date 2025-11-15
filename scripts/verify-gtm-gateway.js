#!/usr/bin/env node

/**
 * Script để verify Google Tag Gateway configuration
 * Chạy: node scripts/verify-gtm-gateway.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);
const resolveCname = promisify(dns.resolveCname);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Đọc config
function readConfig() {
	try {
		const configPath = join(projectRoot, 'src/config.ts');
		const configContent = readFileSync(configPath, 'utf-8');
		
		// Extract gateway domain
		const gatewayMatch = configContent.match(/gatewayDomain:\s*["']([^"']+)["']/);
		const gaIdMatch = configContent.match(/id:\s*["']([^"']+)["']/);
		
		return {
			gatewayDomain: gatewayMatch ? gatewayMatch[1] : null,
			gaId: gaIdMatch ? gaIdMatch[1] : null,
		};
	} catch (error) {
		console.error('❌ Không thể đọc config:', error.message);
		return null;
	}
}

// Kiểm tra DNS
async function checkDNS(domain) {
	console.log(`\n🔍 Kiểm tra DNS cho: ${domain}`);
	
	try {
		// Kiểm tra CNAME
		const cnameRecords = await resolveCname(domain);
		console.log(`✅ CNAME records:`);
		cnameRecords.forEach(record => {
			console.log(`   → ${record}`);
		});
		
		// Kiểm tra A record (nếu có)
		try {
			const aRecords = await resolve4(domain);
			console.log(`✅ A records (IPv4):`);
			aRecords.forEach(record => {
				console.log(`   → ${record}`);
			});
		} catch (e) {
			// Không có A record là bình thường nếu chỉ có CNAME
		}
		
		return true;
	} catch (error) {
		console.error(`❌ DNS Error: ${error.message}`);
		console.log(`\n💡 Hướng dẫn:`);
		console.log(`   1. Kiểm tra DNS record trong Cloudflare`);
		console.log(`   2. Đảm bảo CNAME record trỏ đến: gtm-gateway.googletagmanager.com`);
		console.log(`   3. Chờ DNS propagate (có thể mất 5-10 phút)`);
		return false;
	}
}

// Kiểm tra HTTP endpoint
async function checkHTTP(domain, gaId) {
	console.log(`\n🌐 Kiểm tra HTTP endpoint...`);
	const url = `https://${domain}/gtag/js?id=${gaId}`;
	
	try {
		const response = await fetch(url, { method: 'HEAD' });
		
		if (response.ok) {
			console.log(`✅ Endpoint hoạt động: ${url}`);
			console.log(`   Status: ${response.status} ${response.statusText}`);
			
			// Kiểm tra headers
			const gatewayHeader = response.headers.get('x-goog-tag-gateway');
			if (gatewayHeader) {
				console.log(`   ✅ Google Tag Gateway header: ${gatewayHeader}`);
			}
			
			return true;
		} else {
			console.error(`❌ Endpoint trả về lỗi: ${response.status} ${response.statusText}`);
			return false;
		}
	} catch (error) {
		console.error(`❌ Không thể kết nối đến endpoint: ${error.message}`);
		console.log(`\n💡 Có thể do:`);
		console.log(`   - DNS chưa propagate`);
		console.log(`   - Domain chưa được verify trong Google Ads`);
		console.log(`   - SSL certificate chưa được cấu hình`);
		return false;
	}
}

// Main function
async function main() {
	console.log('🚀 Google Tag Gateway Verification Script\n');
	console.log('=' .repeat(50));
	
	const config = readConfig();
	
	if (!config) {
		process.exit(1);
	}
	
	if (!config.gatewayDomain) {
		console.log('⚠️  Gateway domain chưa được cấu hình trong src/config.ts');
		console.log('   Thêm: gatewayDomain: "gtm.boospace.tech"');
		process.exit(1);
	}
	
	if (!config.gaId) {
		console.log('⚠️  Google Analytics ID chưa được cấu hình');
		process.exit(1);
	}
	
	console.log(`\n📋 Configuration:`);
	console.log(`   Gateway Domain: ${config.gatewayDomain}`);
	console.log(`   Google Analytics ID: ${config.gaId}`);
	console.log(`   Expected URL: https://${config.gatewayDomain}/gtag/js?id=${config.gaId}`);
	
	// Kiểm tra DNS
	const dnsOk = await checkDNS(config.gatewayDomain);
	
	// Kiểm tra HTTP
	const httpOk = await checkHTTP(config.gatewayDomain, config.gaId);
	
	// Tổng kết
	console.log(`\n${'='.repeat(50)}`);
	console.log(`\n📊 Kết quả:`);
	console.log(`   DNS: ${dnsOk ? '✅ OK' : '❌ FAIL'}`);
	console.log(`   HTTP: ${httpOk ? '✅ OK' : '❌ FAIL'}`);
	
	if (dnsOk && httpOk) {
		console.log(`\n🎉 Google Tag Gateway đã được cấu hình đúng!`);
		console.log(`\n📝 Bước tiếp theo:`);
		console.log(`   1. Verify domain trong Google Ads dashboard`);
		console.log(`   2. Test trên website thực tế`);
		console.log(`   3. Kiểm tra conversion tracking`);
	} else {
		console.log(`\n⚠️  Cần kiểm tra lại cấu hình. Xem file GOOGLE_TAG_GATEWAY_SETUP.md để biết chi tiết.`);
		process.exit(1);
	}
}

main().catch(error => {
	console.error('❌ Error:', error);
	process.exit(1);
});

