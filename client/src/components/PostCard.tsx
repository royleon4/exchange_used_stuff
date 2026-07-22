import { Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { PostCard as PostCardType } from "../../../shared/types";
import { useLanguage } from "../lib/i18n";
import ImageCarousel from "./ImageCarousel";

const statusKey = {
  considering: "statusConsidering",
  bringing: "statusBringing",
  not_bringing: "statusNotBringing",
  closed: "statusClosed",
} as const;

export default function PostCard({ post }: { post: PostCardType }) {
  const { t } = useLanguage();
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
        <div className="p-5">
          <p className="eyebrow">{post.authorNickname}</p>
          <h2 className="mt-2 line-clamp-2 text-lg font-semibold text-ink-900">{post.title}</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-700">{post.description}</p>
          <div className="mt-5 flex items-center justify-between border-t border-cream-200 pt-4 text-sm text-ink-700">
            <span className="inline-flex items-center gap-1.5">
              <Heart size={17} className="text-sage-600" />
              {t("peopleWant", { count: post.wantCount })}
            </span>
            <span className="inline-flex items-center gap-1.5" aria-label={t("comments")}>
              <MessageCircle size={17} />{post.commentCount}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
