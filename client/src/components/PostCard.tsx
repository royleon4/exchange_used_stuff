import { Heart, Image as ImageIcon, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { PostCard as PostCardType } from "../../../shared/types";

const statusLabel = {
  considering: "還在考慮",
  bringing: "確定帶來",
  not_bringing: "這次不帶",
  closed: "已結束",
} as const;

export default function PostCard({ post }: { post: PostCardType }) {
  return (
    <article className="card group overflow-hidden transition duration-300 hover:-translate-y-1">
      <Link to={`/posts/${post.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-sage-50">
          {post.coverImageId ? (
            <img
              src={`/api/media/${post.coverImageId}`}
              alt={`${post.title} 封面`}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-sage-300"><ImageIcon size={42} /></div>
          )}
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-sage-700 backdrop-blur">
            {statusLabel[post.itemStatus]}
          </span>
          {post.imageCount > 1 && (
            <span className="absolute bottom-4 right-4 rounded-full bg-ink-900/75 px-2.5 py-1 text-xs text-white">
              {post.imageCount} 張
            </span>
          )}
        </div>
        <div className="p-5">
          <p className="eyebrow">{post.authorNickname}</p>
          <h2 className="mt-2 line-clamp-2 text-lg font-semibold text-ink-900">{post.title}</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-700">{post.description}</p>
          <div className="mt-5 flex items-center justify-between border-t border-cream-200 pt-4 text-sm text-ink-700">
            <span className="inline-flex items-center gap-1.5"><Heart size={17} className="text-sage-600" />{post.wantCount} 人想要</span>
            <span className="inline-flex items-center gap-1.5"><MessageCircle size={17} />{post.commentCount}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
