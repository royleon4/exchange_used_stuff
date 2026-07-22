import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useLanguage } from "../lib/i18n";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  if (isLoading) return <div className="page-shell py-20 text-center">{t("loading")}</div>;
  if (!user) return <Navigate to="/login?next=/admin" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  const tabs = [t("adminPosts"), t("adminComments"), t("adminMembers"), t("adminImages"), t("adminSettings")];
  return (
    <section className="page-shell py-10">
      <div className="card overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 px-6 py-4">
          <div>
            <p className="font-semibold text-sage-700">{t("admin")}</p>
            <p className="text-sm text-ink-700">{t("adminSignedIn", { name: user.nickname })}</p>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-cream-200 px-4 pt-3">
          {tabs.map((tab, index) => (
            <button
              type="button"
              key={tab}
              className={`whitespace-nowrap rounded-t-xl px-4 py-3 text-sm font-medium ${
                index === 0 ? "bg-sage-600 text-white" : "text-ink-700 hover:bg-sage-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <main className="p-6 sm:p-8">
          <h1 className="font-display text-4xl font-semibold">{t("adminPosts")}</h1>
          <p className="mt-4 leading-7 text-ink-700">{t("adminPending")}</p>
        </main>
      </div>
    </section>
  );
}
