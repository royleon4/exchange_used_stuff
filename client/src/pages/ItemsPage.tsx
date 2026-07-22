import { useQuery } from "@tanstack/react-query";
import { PackageOpen } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { PostCard as PostCardType } from "../../../shared/types";
import PostCard from "../components/PostCard";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useLanguage } from "../lib/i18n";

export default function ItemsPage() {
  const [sort, setSort] = useState("latest");
  const { user } = useAuth();
  const { t } = useLanguage();
  const query = useQuery({
    queryKey: ["posts", sort],
    queryFn: () => api<{ posts: PostCardType[] }>(`/api/posts?sort=${sort}&pageSize=24`),
  });

  return (
    <section className="page-shell py-12 sm:py-16">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">{t("itemsEyebrow")}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink-900 sm:text-5xl">{t("itemsTitle")}</h1>
          <p className="mt-4 leading-7 text-ink-700">{t("itemsDescription")}</p>
        </div>
        <label className="flex items-center gap-3 text-sm text-ink-700">
          {t("sort")}
          <select
            className="field !w-auto !rounded-full !py-2"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="latest">{t("sortLatest")}</option>
            <option value="oldest">{t("sortOldest")}</option>
            <option value="wanted">{t("sortWanted")}</option>
          </select>
        </label>
      </div>

      {query.isLoading && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-96 animate-pulse rounded-3xl bg-white/70" />
          ))}
        </div>
      )}

      {query.isError && <div className="card mt-8 p-8 text-center text-ink-700">{t("loadItemsError")}</div>}

      {query.data?.posts.length === 0 && (
        <div className="card mt-8 px-6 py-16 text-center">
          <PackageOpen className="mx-auto text-sage-300" size={48} />
          <h2 className="mt-5 text-xl font-semibold">{t("emptyTitle")}</h2>
          <p className="mt-2 text-ink-700">{t("emptyDescription")}</p>
          <Link to={user ? "/posts/new" : "/register"} className="btn-primary mt-6">
            {t("publishFirst")}
          </Link>
        </div>
      )}

      {!!query.data?.posts.length && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
