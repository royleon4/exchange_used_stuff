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
    <section className="page-shell flex h-full min-h-0 w-full flex-1 -translate-y-[clamp(0.75rem,3dvh,2rem)] flex-col justify-center overflow-hidden py-[clamp(0.75rem,2dvh,1.5rem)]">
      <div className="max-w-4xl">
        <h1 className="font-display text-[clamp(2.2rem,6.4vmin,4.5rem)] font-semibold leading-[0.98] text-ink-900">
          {titleStart} <span className="text-sage-600">{titleAccent}</span>
        </h1>
        <p className="mt-[clamp(0.7rem,2dvh,1.5rem)] max-w-2xl text-[clamp(0.8rem,1.65vmin,1.125rem)] leading-[1.55] text-ink-700">
          {description}
        </p>
      </div>

      <div className="mt-[clamp(0.9rem,3dvh,2.5rem)] grid gap-[clamp(0.55rem,1.5dvh,1rem)] md:grid-cols-2">
        <Link
          to={user ? "/posts/new" : "/register?next=/posts/new"}
          className="group flex min-h-[clamp(5.25rem,13dvh,7rem)] items-center gap-[clamp(0.65rem,2vw,1rem)] rounded-[clamp(1.4rem,3vw,2rem)] bg-sage-600 px-[clamp(0.9rem,2.5vw,1.5rem)] py-[clamp(0.75rem,2dvh,1.25rem)] text-left text-white shadow-lg shadow-sage-600/20 transition duration-200 hover:-translate-y-1 hover:bg-sage-700 hover:shadow-xl focus-visible:-translate-y-1"
        >
          <span className="grid size-[clamp(2.8rem,6vmin,3.5rem)] shrink-0 place-items-center rounded-2xl bg-white/15">
            <PackageOpen className="size-[clamp(1.35rem,3vmin,1.6rem)]" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[clamp(0.95rem,2.2vmin,1.25rem)] font-bold">
              {user ? t("heroPublish") : t("heroJoin")}
            </span>
            <span className="mt-1 block text-[clamp(0.72rem,1.5vmin,0.875rem)] leading-[1.45] text-white/80">
              {t("newPostDescription")}
            </span>
          </span>
          <ArrowRight className="size-[clamp(1.2rem,2.8vmin,1.4rem)] shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>

        <Link
          to="/items"
          className="group flex min-h-[clamp(5.25rem,13dvh,7rem)] items-center gap-[clamp(0.65rem,2vw,1rem)] rounded-[clamp(1.4rem,3vw,2rem)] border-2 border-sage-100 bg-white/90 px-[clamp(0.9rem,2.5vw,1.5rem)] py-[clamp(0.75rem,2dvh,1.25rem)] text-left text-sage-700 shadow-md transition duration-200 hover:-translate-y-1 hover:border-sage-300 hover:bg-sage-50 hover:shadow-lg focus-visible:-translate-y-1"
        >
          <span className="grid size-[clamp(2.8rem,6vmin,3.5rem)] shrink-0 place-items-center rounded-2xl bg-sage-100 text-sage-700">
            <Heart className="size-[clamp(1.35rem,3vmin,1.6rem)]" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[clamp(0.95rem,2.2vmin,1.25rem)] font-bold text-ink-900">{t("heroBrowse")}</span>
            <span className="mt-1 block text-[clamp(0.72rem,1.5vmin,0.875rem)] leading-[1.45] text-ink-700">
              {t("itemsDescription")}
            </span>
          </span>
          <ArrowRight className="size-[clamp(1.2rem,2.8vmin,1.4rem)] shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
