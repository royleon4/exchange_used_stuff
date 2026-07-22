import { ArrowRight, Heart, PackageOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useLanguage } from "../lib/i18n";

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <>
      <section className="page-shell py-12 sm:py-20">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/75 px-6 py-12 shadow-soft backdrop-blur sm:px-12 sm:py-20">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-sage-100/70 blur-2xl" />
          <div className="absolute -bottom-24 left-1/3 size-72 rounded-full bg-cream-200/80 blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="eyebrow">{t("heroEyebrow")}</p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.98] text-ink-900 sm:text-7xl">
              {t("heroTitleStart")} <span className="text-sage-600">{t("heroTitleAccent")}</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-ink-700 sm:text-lg">{t("heroDescription")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={user ? "/posts/new" : "/register"} className="btn-primary">
                {user ? t("heroPublish") : t("heroJoin")} <ArrowRight size={18} />
              </Link>
              <Link to="/items" className="btn-secondary">
                {t("heroBrowse")}
              </Link>
            </div>
          </div>
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
