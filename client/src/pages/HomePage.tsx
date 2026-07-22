import { ArrowRight, Heart, PackageOpen, Sparkles } from "lucide-react";
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
    <>
      <section className="page-shell py-14 sm:py-24">
        <div className="max-w-4xl">
          <p className="eyebrow">{t("heroEyebrow")}</p>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.98] text-ink-900 sm:text-7xl">
            {titleStart} <span className="text-sage-600">{titleAccent}</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-ink-700 sm:text-lg">{description}</p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <Link
            to={user ? "/posts/new" : "/register?next=/posts/new"}
            className="group flex min-h-28 items-center gap-4 rounded-[2rem] bg-sage-600 px-5 py-5 text-left text-white shadow-lg shadow-sage-600/20 transition duration-200 hover:-translate-y-1 hover:bg-sage-700 hover:shadow-xl focus-visible:-translate-y-1 sm:min-h-32 sm:gap-5 sm:px-7 sm:py-6"
          >
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15 sm:size-16">
              <PackageOpen size={28} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold sm:text-xl">
                {user ? t("heroPublish") : t("heroJoin")}
              </span>
              <span className="mt-1.5 block text-sm leading-6 text-white/80">
                {t("newPostDescription")}
              </span>
            </span>
            <ArrowRight className="shrink-0 transition-transform group-hover:translate-x-1" size={24} aria-hidden="true" />
          </Link>

          <Link
            to="/items"
            className="group flex min-h-28 items-center gap-4 rounded-[2rem] border-2 border-sage-100 bg-white/90 px-5 py-5 text-left text-sage-700 shadow-md transition duration-200 hover:-translate-y-1 hover:border-sage-300 hover:bg-sage-50 hover:shadow-lg focus-visible:-translate-y-1 sm:min-h-32 sm:gap-5 sm:px-7 sm:py-6"
          >
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sage-100 text-sage-700 sm:size-16">
              <Heart size={28} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold text-ink-900 sm:text-xl">{t("heroBrowse")}</span>
              <span className="mt-1.5 block text-sm leading-6 text-ink-700">
                {t("itemsDescription")}
              </span>
            </span>
            <ArrowRight className="shrink-0 transition-transform group-hover:translate-x-1" size={24} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="page-shell grid gap-4 pb-16 sm:grid-cols-3 sm:pb-24">
        <div className="card p-6">
          <span className="grid size-11 place-items-center rounded-2xl bg-sage-50 text-sage-600">
            <PackageOpen size={20} />
          </span>
          <h2 className="mt-4 font-semibold text-ink-900">{t("shareTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">{t("shareDescription")}</p>
        </div>
        <div className="card p-6">
          <span className="grid size-11 place-items-center rounded-2xl bg-sage-50 text-sage-600">
            <Heart size={20} />
          </span>
          <h2 className="mt-4 font-semibold text-ink-900">{t("interestTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">{t("interestDescription")}</p>
        </div>
        <div className="card p-6">
          <span className="grid size-11 place-items-center rounded-2xl bg-sage-50 text-sage-600">
            <Sparkles size={20} />
          </span>
          <h2 className="mt-4 font-semibold text-ink-900">{t("meetTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">{t("meetDescription")}</p>
        </div>
      </section>
    </>
  );
}
