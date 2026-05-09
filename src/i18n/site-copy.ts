import { profileConfig, siteConfig } from "../config";
import type { SiteLocale } from "../utils/locale-utils";

const siteSubtitles: Record<SiteLocale, string> = {
	vi: siteConfig.subtitle,
	en: "Practical solutions for people who want simpler, sharper work",
};

const profileBios: Record<SiteLocale, string> = {
	vi: profileConfig.bio || "",
	en: "Practical solutions for people who want simpler work with tech, SaaS, and AI.",
};

const bannerCreditTexts: Record<SiteLocale, string> = {
	vi: siteConfig.banner.credit.text,
	en: "Work and live smarter, without unnecessary complexity",
};

export function getSiteSubtitle(locale: SiteLocale): string {
	return siteSubtitles[locale];
}

export function getProfileBio(locale: SiteLocale): string {
	return profileBios[locale];
}

export function getBannerCreditText(locale: SiteLocale): string {
	return bannerCreditTexts[locale];
}
