import { ArrowRight, Heart, PackageOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useLanguage } from "../lib/i18n";
import { fallbackSiteSettings, useSiteSettings } from "../lib/site-settings";

export default function HomePage() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const settingsQuery = useSiteSettings();
  const settings = settingsQuery.data?.settings ?? fallbackSiteSettings;
  const titleStart = language === "zh" ? settings.homeTitleStartZh : settings.homeTitleStartEn;
  const titleAccent = language === "zh" ? settings.homeTitleAccentZh : settings.homeTitleAccentEn;
  const description = language === "zh" ? settings.homeDescriptionZh : settings.homeDescriptionEn;

  return (
    <section className="page-shell flex w-full flex-1 flex-col justify-center py-[clamp(1rem,4vh,3rem)]">
      <div className="max-w-4xl">
        <h1 className="font-display text-[clamp(2.6rem,7vw,4.5rem)] font-semibold leading-[0.98] text-ink-900">
          {titleStart} <span className="text-sage-600">{titleAccent}</span>
        </h1>
        <p className="mt-[clamp(1rem,2.5vh,1.75rem)] max-w-2xl text-sm leading-6 text-ink-700 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
          {description}
        </p>
      </div>

      <div className="mt-[clamp(1.25rem,3.5vh,3rem)] grid gap-3 md:grid-cols-2 sm:gap-4">
        <Link
          to={user ? "/posts/new" : "/register?next=/posts/new"}
          className="group flex min-h-24 items-center gap-3 rounded-[1.75rem] bg-sage-600 px-4 py-4 text-left text-white shadow-lg shadow-sage-600/20 transition duration-200 hover:-translate-y-1 hover:bg-sage-700 hover:shadow-xl focus-visible:-translate-y-1 sm:min-h-28 sm:gap-4 sm:rounded-[2rem] sm:px-6 sm:py-5"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15 sm:size-14">
            <PackageOpen size={25} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold sm:text-lg lg:text-xl">
              {user ? t("heroPublish") : t("heroJoin")}
            </span>
            <span className="mt-1 block text-xs leading-5 text-white/80 sm:text-sm sm:leading-6">
              {t("newPostDescription")}
            </span>
          </span>
          <ArrowRight className="shrink-0 transition-transform group-hover:translate-x-1" size={22} aria-hidden="true" />
        </Link>

        <Link
          to="/items"
          className="group flex min-h-24 items-center gap-3 rounded-[1.75rem] border-2 border-sage-100 bg-white/90 px-4 py-4 text-left text-sage-700 shadow-md transition duration-200 hover:-translate-y-1 hover:border-sage-300 hover:bg-sage-50 hover:shadow-lg focus-visible:-translate-y-1 sm:min-h-28 sm:gap-4 sm:rounded-[2rem] sm:px-6 sm:py-5"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sage-100 text-sage-700 sm:size-14">
            <Heart size={25} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold text-ink-900 sm:text-lg lg:text-xl">{t("heroBrowse")}</span>
            <span className="mt-1 block text-xs leading-5 text-ink-700 sm:text-sm sm:leading-6">
              {t("itemsDescription")}
            </span>
          </span>
          <ArrowRight className="shrink-0 transition-transform group-hover:translate-x-1" size={22} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
