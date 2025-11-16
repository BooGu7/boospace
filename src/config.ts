import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "Boo Space",
	subtitle: "Chia sẻ giải pháp thực tế cho người yêu tối giản công việc",
	lang: "vi", // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
	themeColor: {
		hue: 200, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
		fixed: true, // Hide the theme color picker for visitors
	},
	banner: {
		enable: true,
		src: "assets/images/banner.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: true, // Display the credit text of the banner image
			text: "Sống và làm việc thông minh, không phức tạp", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		// Leave this array empty to use the default favicon
		// {
		//   src: '/favicon/icon.png',    // Path of the favicon, relative to the /public directory
		//   theme: 'light',              // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
		//   sizes: '32x32',              // (Optional) Size of the favicon, set only if you have favicons of different sizes
		// }
	],
	googleAnalytics: {
		id: "AW-16629366126", // Google Analytics 4 Measurement ID (e.g., G-XXXXXXXXXX). Leave empty to disable.
		gatewayDomain: "", // Google Tag Gateway domain. Tạm thời để trống vì DNS chưa được cấu hình. Sau khi cấu hình DNS, thay bằng "gtm.boospace.tech"
	},
	googleTagManager: {
		id: "AW-16629366126", // Google Tag Manager Container ID (e.g., GTM-XXXXXXX). Leave empty to disable.
	},
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		{
			name: "Workflow",
			url: "https://primary-production-7e4d.up.railway.app", // Internal links should not include the base path, as it is automatically added
			external: true, // Show an external link icon and will open in a new tab
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/avatar.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: "Boo Space",
	bio: "Chia sẻ giải pháp thực tế cho người yêu tối giản công việc",
	links: [
		{
			name: "Facebook",
			icon: "iconoir:facebook-tag", // Visit https://icones.js.org/ for icon codes
			// You will need to install the corresponding icon set if it's not already included
			// `pnpm add @iconify-json/<icon-set-name>`
			url: "https://www.facebook.com/themilkiway",
		},
		{
			name: "Instagram",
			icon: "line-md:instagram",
			url: "https://www.instagram.com/milky4897",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: false,
	name: "",
	url: "",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};
