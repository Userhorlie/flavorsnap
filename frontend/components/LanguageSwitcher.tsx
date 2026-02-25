import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { analytics } from "@/utils/analytics";

const localeLabels: Record<string, string> = {
  en: "English",
  fr: "Francais",
  ar: "Arabic",
  yo: "Yoruba",
};

export default function LanguageSwitcher() {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { locale, locales, pathname, asPath, query } = router;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    
    // Track language change
    analytics.trackLanguageChange(newLocale);
    
    router.push({ pathname, query }, asPath, { locale: newLocale });
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <label htmlFor="language-switcher" className="text-sm font-medium sm:text-base">
        {t("select_language")}
      </label>
      <select
        id="language-switcher"
        value={locale}
        onChange={handleChange}
        className="min-h-[44px] w-full rounded-md border border-gray-300 bg-black px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 cursor-pointer sm:w-auto sm:min-w-[11rem] sm:text-base"
        aria-label={t("select_language")}
      >
        {locales?.map((loc) => (
          <option className="bg-black" key={loc} value={loc}>
            {localeLabels[loc] || loc}
          </option>
        ))}
      </select>
    </div>
  );
}
