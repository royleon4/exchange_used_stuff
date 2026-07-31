import { useInfiniteQuery } from "@tanstack/react-query";
import { PackageOpen, PenLine } from "lucide-react";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { PostCard as PostCardType } from "../../../shared/types";
import PostCard from "../components/PostCard";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useLanguage } from "../lib/i18n";

const sorts = new Set(["latest", "oldest", "wanted"]);

type PostsPage = {
  posts: PostCardType[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export default function ItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSort = searchParams.get("sort") ?? "latest";
  const sort = sorts.has(requestedSort) ? requestedSort : "latest";
  const { user } = useAuth();
  const { t } = useLanguage();
  const query = useInfiniteQuery({
    queryKey: ["posts", sort],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api<PostsPage>(`/api/posts?sort=${sort}&page=${pageParam}&pageSize=30`),
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.pagination.page * lastPage.pagination.pageSize;
      return loaded < lastPage.pagination.total ? lastPage.pagination.page + 1 : undefined;
    },
  });
  const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];
  const publishPath = user ? "/posts/new" : "/register?next=/posts/new";

  useEffect(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

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
            onChange={(event) => setSearchParams({ sort: event.target.value }, { replace: true })}
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

      {!query.isLoading && posts.length === 0 && (
        <div className="card mt-8 px-6 py-16 text-center">
          <PackageOpen className="mx-auto text-sage-300" size={48} />
          <h2 className="mt-5 text-xl font-semibold">{t("emptyTitle")}</h2>
          <p className="mt-2 text-ink-700">{t("emptyDescription")}</p>
          <Link to={publishPath} className="btn-primary mt-6">
            {t("publishFirst")}
          </Link>
        </div>
      )}

      {posts.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} showCreatedAt />
          ))}
        </div>
      )}

      <Link
        to={publishPath}
        className="fixed right-4 z-40 inline-flex min-h-14 items-center gap-2 rounded-full bg-sage-600 px-5 py-3 font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-sage-700 focus:outline-none focus:ring-4 focus:ring-sage-200 sm:right-8"
        style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        aria-label={t("floatingPost")}
      >
        <PenLine size={20} />
        <span>{t("floatingPost")}</span>
      </Link>
    </section>
  );
}
