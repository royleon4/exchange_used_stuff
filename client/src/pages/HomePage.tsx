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
    <section className="page-shell flex h-full min-h-0 w-full flex-1 -translate-y-[clamp(0.35rem,1.5dvh,1rem)] flex-col justify-center overflow-hidden py-[clamp(0.5rem,1.5dvh,1.25rem)]">
      {settings.homeHeroImageUrl && (
        <div className="mb-[clamp(0.45rem,1.4dvh,1rem)] flex min-h-0 shrink items-center justify-center py-[clamp(0.35rem,1dvh,0.75rem)]">
          <img
            src={settings.homeHeroImageUrl}
            alt=""
            className="max-h-[clamp(3rem,11dvh,7rem)] w-full max-w-4xl object-contain"
            draggable={false}
          />
        </div>
      )}

      <div className="max-w-4xl">
        <h1
          className="font-display text-[clamp(2.3625rem,calc(5.9vmin+5px),4.5625rem)] font-semibold leading-[0.98]"
          style={{ color: settings.homeTitleColor }}
        >
          {titleStart}{" "}
          <span style={{ color: settings.homeTitleAccentColor }}>{titleAccent}</span>
        </h1>
        <p className="mt-[clamp(0.65rem,1.8dvh,1.35rem)] max-w-2xl text-[clamp(0.9675rem,calc(1.55vmin+3px),1.2625rem)] leading-[1.5] text-ink-700">
          {description}
        </p>
      </div>

      <div className="mt-[clamp(0.8rem,2.5dvh,2.1rem)] grid gap-[clamp(0.5rem,1.3dvh,0.9rem)] md:grid-cols-2">
        <Link
          to={user ? "/posts/new" : "/register?next=/posts/new"}
          className="group flex min-h-[clamp(5rem,12dvh,6.75rem)] items-center gap-[clamp(0.6rem,1.8vw,0.95rem)] rounded-[clamp(1.35rem,2.8vw,1.9rem)] bg-sage-600 px-[clamp(0.85rem,2.3vw,1.4rem)] py-[clamp(0.7rem,1.8dvh,1.15rem)] text-left text-white shadow-lg shadow-sage-600/20 transition duration-200 hover:-translate-y-1 hover:bg-sage-700 hover:shadow-xl focus-visible:-translate-y-1"
        >
          <span className="grid size-[clamp(2.65rem,5.5vmin,3.35rem)] shrink-0 place-items-center rounded-2xl bg-white/15">
            <PackageOpen className="size-[clamp(1.3rem,2.8vmin,1.55rem)]" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[clamp(1.1075rem,calc(2.05vmin+3px),1.3875rem)] font-bold">
              {user ? t("heroPublish") : t("heroJoin")}
            </span>
            <span className="mt-1 block text-[clamp(0.8875rem,calc(1.4vmin+3px),1.0375rem)] leading-[1.42] text-white/80">
              {t("newPostDescription")}
            </span>
          </span>
          <ArrowRight className="size-[clamp(1.15rem,2.6vmin,1.35rem)] shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>

        <Link
          to="/items"
          className="group flex min-h-[clamp(5rem,12dvh,6.75rem)] items-center gap-[clamp(0.6rem,1.8vw,0.95rem)] rounded-[clamp(1.35rem,2.8vw,1.9rem)] border-2 border-sage-100 bg-white/90 px-[clamp(0.85rem,2.3vw,1.4rem)] py-[clamp(0.7rem,1.8dvh,1.15rem)] text-left text-sage-700 shadow-md transition duration-200 hover:-translate-y-1 hover:border-sage-300 hover:bg-sage-50 hover:shadow-lg focus-visible:-translate-y-1"
        >
          <span className="grid size-[clamp(2.65rem,5.5vmin,3.35rem)] shrink-0 place-items-center rounded-2xl bg-sage-100 text-sage-700">
            <Heart className="size-[clamp(1.3rem,2.8vmin,1.55rem)]" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[clamp(1.1075rem,calc(2.05vmin+3px),1.3875rem)] font-bold text-ink-900">{t("heroBrowse")}</span>
            <span className="mt-1 block text-[clamp(0.8875rem,calc(1.4vmin+3px),1.0375rem)] leading-[1.42] text-ink-700">
              {t("itemsDescription")}
            </span>
          </span>
          <ArrowRight className="size-[clamp(1.15rem,2.6vmin,1.35rem)] shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}