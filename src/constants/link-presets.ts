import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import type { SiteLocale } from "@utils/locale-utils";
import { LinkPreset, type NavBarLink } from "@/types/config";

export function getLinkPreset(locale: SiteLocale): {
	[key in LinkPreset]: NavBarLink;
} {
	return {
		[LinkPreset.Home]: {
			name: i18n(locale, I18nKey.home),
			url: "/",
		},
		[LinkPreset.About]: {
			name: i18n(locale, I18nKey.about),
			url: "/about/",
		},
		[LinkPreset.Archive]: {
			name: i18n(locale, I18nKey.archive),
			url: "/archive/",
		},
	};
}
