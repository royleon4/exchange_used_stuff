import { Heart, LogOut, Megaphone, Menu, Plus, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useLanguage } from "../lib/i18n";
import { fallbackSiteSettings, useSiteSettings } from "../lib/site-settings";
import LanguageSwitcher from "./LanguageSwitcher";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2 text-sm font-medium transition ${
    isActive ? "bg-sage-50 text-sage-700" : "text-ink-700 hover:bg-white/70 hover:text-ink-900"
  }`;

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { language, t } = useLanguage();
  const settingsQuery = useSiteSettings();
  const settings = settingsQuery.data?.settings ?? fallbackSiteSettings;
  const announcement = language === "zh" ? settings.announcement : settings.announcementEn;
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    if (!isHomePage) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
    };
  }, [isHomePage]);

  async function handleLogout() {
    await logout();
    setOpen(false);
    navigate("/");
  }

  return (
    <div className={isHomePage ? "flex h-[100dvh] min-h-0 flex-col overflow-hidden overscroll-none" : "flex min-h-screen flex-col"}>
      <header className="sticky top-0 z-40 shrink-0 border-b border-white/70 bg-cream-50/85 backdrop-blur-xl">
        <div className="page-shell flex min-h-16 items-center justify-between gap-4 py-2">
          <Link to="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
            <span className="grid size-10 place-items-center rounded-full bg-sage-600 text-white shadow-sm transition group-hover:rotate-6">
              <Heart size={18} fill="currentColor" />
            </span>
            <span>
              <span className="block font-display text-xl font-semibold leading-none text-ink-900">Excel & Min</span>
              <span className="mt-1 block text-[10px] tracking-[0.13em] text-ink-700 sm:text-[11px]">{t("brandSubtitle")}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={navClass}>{t("home")}</NavLink>
            <NavLink to="/items" className={navClass}>{t("itemsWall")}</NavLink>
            {user && <NavLink to="/me" className={navClass}>{t("myCorner")}</NavLink>}
            {user?.role === "admin" && <NavLink to="/admin" className={navClass}>{t("admin")}</NavLink>}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitcher />
            {user ? (
              <>
                <span className="px-2 text-sm text-ink-700">{t("hello", { name: user.nickname })}</span>
                <Link to="/posts/new" className="btn-primary"><Plus size={17} />{t("publishItem")}</Link>
                <button type="button" className="btn-secondary !px-3" onClick={handleLogout} aria-label={t("logout")}>
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">{t("login")}</Link>
                <Link to="/register" className="btn-primary">{t("register")}</Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher compact />
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full bg-white"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {open && (
          <div className="page-shell pb-4 md:hidden">
            <nav className="card flex flex-col gap-1 p-3">
              <NavLink to="/" end className={navClass} onClick={() => setOpen(false)}>{t("home")}</NavLink>
              <NavLink to="/items" className={navClass} onClick={() => setOpen(false)}>{t("itemsWall")}</NavLink>
              {user && <NavLink to="/me" className={navClass} onClick={() => setOpen(false)}>{t("myCorner")}</NavLink>}
              {user?.role === "admin" && <NavLink to="/admin" className={navClass} onClick={() => setOpen(false)}>{t("admin")}</NavLink>}
              <div className="my-2 h-px bg-cream-200" />
              {user ? (
                <>
                  <Link to="/posts/new" className="btn-primary" onClick={() => setOpen(false)}><Plus size={17} />{t("publishItem")}</Link>
                  <button type="button" className="btn-secondary" onClick={handleLogout}><LogOut size={17} />{t("logout")}</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary" onClick={() => setOpen(false)}><UserRound size={17} />{t("login")}</Link>
                  <Link to="/register" className="btn-primary" onClick={() => setOpen(false)}>{t("register")}</Link>
                </>
              )}
            </nav>
          </div>
        )}

        {settings.announcementEnabled && announcement && (
          <div className="border-t border-sage-100 bg-sage-600 text-white">
            <div className="page-shell flex items-start justify-center gap-2 py-2.5 text-center text-sm leading-6">
              <Megaphone className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
              <p>{announcement}</p>
            </div>
          </div>
        )}
      </header>

      <main className={isHomePage ? "flex min-h-0 flex-1 overflow-hidden" : "flex-1"}><Outlet /></main>

      {!isHomePage && (
        <footer className="mt-20 border-t border-white/70 py-10">
          <div className="page-shell text-center text-sm text-ink-700">
            <p className="font-display text-2xl text-ink-900">{settings.siteTitle}</p>
            <p className="mt-2">{t("footerTagline")}</p>
            <p className="mt-4 text-xs">{t("footerDisclaimer")}</p>
          </div>
        </footer>
      )}
    </div>
  );
}
