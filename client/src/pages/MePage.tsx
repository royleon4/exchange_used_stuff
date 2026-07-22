import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { useLanguage } from "../lib/i18n";

export default function MePage() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const posts = useQuery({
    queryKey: ["me", "posts"],
    queryFn: () => api<{ posts: Array<Record<string, unknown>> }>("/api/me/posts"),
    enabled: !!user,
  });
  const wants = useQuery({
    queryKey: ["me", "wants"],
    queryFn: () => api<{ posts: Array<Record<string, unknown>> }>("/api/me/wants"),
    enabled: !!user,
  });

  if (isLoading) return <div className="page-shell py-20 text-center">{t("loading")}</div>;
  if (!user) return <Navigate to="/login?next=/me" replace />;

  return (
    <section className="page-shell py-12">
      <p className="eyebrow">{t("myCornerEyebrow")}</p>
      <h1 className="mt-3 font-display text-5xl font-semibold">{t("myCornerTitle", { name: user.nickname })}</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">{t("myPosts")}</h2>
          <p className="mt-3 font-display text-4xl text-sage-700">{posts.data?.posts.length ?? 0}</p>
          <p className="mt-1 text-sm text-ink-700">{t("publishedItems")}</p>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold">{t("wantedItems")}</h2>
          <p className="mt-3 font-display text-4xl text-sage-700">{wants.data?.posts.length ?? 0}</p>
          <p className="mt-1 text-sm text-ink-700">{t("expressedInterest")}</p>
        </div>
      </div>
      <div className="card mt-6 p-8 text-ink-700">{t("mePending")}</div>
    </section>
  );
}
