import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { PostCard as PostCardType } from "../../../shared/types";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useLanguage } from "../lib/i18n";
import ImageCarousel from "./ImageCarousel";

const statusKey = {
  considering: "statusConsidering",
  bringing: "statusBringing",
  not_bringing: "statusNotBringing",
  closed: "statusClosed",
} as const;

export default function PostCard({ post }: { post: PostCardType }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const client = useQueryClient();
  const [wanted, setWanted] = useState(post.currentUserWants);
  const [wantCount, setWantCount] = useState(post.wantCount);
  const isOwner = user?.id === post.authorId;

  useEffect(() => {
    setWanted(post.currentUserWants);
    setWantCount(post.wantCount);
  }, [post.currentUserWants, post.wantCount]);

  const want = useMutation({
    mutationFn: async () => {
      const method = wanted ? "DELETE" : "POST";
      await api<unknown>(`/api/posts/${post.id}/want`, { method });
    },
    onMutate: () => {
      const previous = { wanted, wantCount };
      const nextWanted = !wanted;
      setWanted(nextWanted);
      setWantCount((count) => Math.max(0, count + (nextWanted ? 1 : -1)));
      return previous;
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      setWanted(context.wanted);
      setWantCount(context.wantCount);
    },
    onSettled: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["posts"] }),
        client.invalidateQueries({ queryKey: ["post", String(post.id)] }),
        client.invalidateQueries({ queryKey: ["me", "wants"] }),
        client.invalidateQueries({ queryKey: ["me", "posts"] }),
      ]);
    },
  });

  const imageIds = post.imageIds.length > 0
    ? post.imageIds
    : post.coverImageId
      ? [post.coverImageId]
      : [];
  const images = imageIds.map((imageId, index) => ({
    id: imageId,
    url: `/api/media/${imageId}`,
    alt: `${post.title} ${index + 1}`,
  }));

  return (
    <article className="card group overflow-hidden transition duration-300 hover:-translate-y-1">
      <Link to={`/posts/${post.id}`} className="block">
        <ImageCarousel
          images={images}
          imageClassName="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          overlay={(
            <span className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-sage-700 backdrop-blur">
              {t(statusKey[post.itemStatus])}
            </span>
          )}
        />
        <div className="px-5 pb-4 pt-5">
          <p className="eyebrow">{post.authorNickname}</p>
          <h2 className="mt-2 line-clamp-2 text-lg font-semibold text-ink-900">{post.title}</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-700">{post.description}</p>
        </div>
      </Link>

      <div className="mx-5 flex items-center justify-between gap-3 border-t border-cream-200 pb-5 pt-4 text-sm">
        <button
          type="button"
          className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-55 ${
            wanted
              ? "border border-sage-100 bg-sage-50 text-sage-700"
              : "bg-sage-600 text-white hover:bg-sage-700"
          }`}
          onClick={() => want.mutate()}
          disabled={want.isPending || isOwner}
          aria-pressed={wanted}
        >
          <Heart size={17} fill={wanted ? "currentColor" : "none"} />
          {isOwner ? t("ownPost") : wanted ? t("cancelWant") : t("want")} · {wantCount}
        </button>
        <Link
          to={`/posts/${post.id}`}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-ink-700 transition hover:bg-cream-50"
          aria-label={t("comments")}
        >
          <MessageCircle size={17} />{post.commentCount}
        </Link>
      </div>
    </article>
  );
}
