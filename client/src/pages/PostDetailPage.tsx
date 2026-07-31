import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ImageCarousel from "../components/ImageCarousel";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useLanguage } from "../lib/i18n";

type PostDetail = {
  id: number;
  authorId: number;
  authorNickname: string;
  title: string;
  description: string;
  itemStatus: "considering" | "bringing" | "not_bringing" | "closed";
  commentsEnabled: boolean;
  wantCount: number;
  currentUserWants: boolean;
  isOwner: boolean;
  createdAt: string;
  images: Array<{ id: number; url: string; width: number; height: number }>;
};
type Comment = { id: number; body: string; authorId: number; authorNickname: string; createdAt: string };
type WantResult = { wanted: boolean; wantCount: number };

const statusKey = {
  considering: "statusConsidering",
  bringing: "statusBringing",
  not_bringing: "statusNotBringing",
  closed: "statusClosed",
} as const;

export default function PostDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [commentError, setCommentError] = useState("");
  const postQuery = useQuery({
    queryKey: ["post", id],
    queryFn: () => api<{ post: PostDetail }>(`/api/posts/${id}`),
  });
  const commentsQuery = useQuery({
    queryKey: ["comments", id],
    queryFn: () => api<{ comments: Comment[] }>(`/api/posts/${id}/comments`),
  });
  const want = useMutation({
    mutationFn: async (nextWanted: boolean) => api<WantResult>(`/api/posts/${id}/want`, {
      method: nextWanted ? "POST" : "DELETE",
    }),
    onSuccess: async (result) => {
      client.setQueryData<{ post: PostDetail }>(["post", id], (current) => current
        ? { post: { ...current.post, currentUserWants: result.wanted, wantCount: result.wantCount } }
        : current);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["post", id] }),
        client.invalidateQueries({ queryKey: ["posts"] }),
        client.invalidateQueries({ queryKey: ["me", "wants"] }),
      ]);
    },
  });

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      navigate(`/login?next=/posts/${id}`);
      return;
    }
    const form = event.currentTarget;
    const body = new FormData(form).get("body");
    setCommentError("");
    try {
      await api(`/api/posts/${id}/comments`, { method: "POST", body: JSON.stringify({ body }) });
      form.reset();
      await commentsQuery.refetch();
    } catch (value) {
      setCommentError(value instanceof ApiError ? value.message : t("commentFailed"));
    }
  }

  async function removePost() {
    if (!window.confirm(t("deleteConfirm"))) return;
    await api(`/api/posts/${id}`, { method: "DELETE" });
    navigate("/items");
  }

  if (postQuery.isLoading) return <div className="page-shell py-20 text-center">{t("loading")}</div>;
  if (!postQuery.data) return <div className="page-shell py-20 text-center">{t("postNotFound")}</div>;
  const post = postQuery.data.post;
  const locale = language === "zh" ? "zh-TW" : "en-US";
  const carouselImages = post.images.map((image, index) => ({
    id: image.id,
    url: image.url,
    alt: `${post.title} ${index + 1}`,
  }));

  return (
    <section className="page-shell py-10 sm:py-16">
      <div className="mb-5 flex justify-start sm:mb-6">
        <Link to="/items" className="btn-secondary">
          <ArrowLeft size={17} aria-hidden="true" />
          {language === "zh" ? "返回物品牆" : "Back to Items"}
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr]">
        <div>
          <ImageCarousel
            images={carouselImages}
            className="card aspect-[4/3] w-full"
            imageClassName="h-full w-full object-contain bg-white"
          />
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-sage-50 px-3 py-1 text-xs font-semibold text-sage-700">
                {t(statusKey[post.itemStatus])}
              </span>
              <span className="text-xs text-ink-700">{new Date(post.createdAt).toLocaleDateString(locale)}</span>
            </div>
            <p className="eyebrow mt-6">{post.authorNickname}</p>
            <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">{post.title}</h1>
            <p className="mt-5 whitespace-pre-wrap leading-8 text-ink-700">{post.description}</p>
            <button
              type="button"
              className={post.currentUserWants ? "btn-secondary mt-7 w-full" : "btn-primary mt-7 w-full"}
              onClick={() => want.mutate(!post.currentUserWants)}
              disabled={want.isPending || post.isOwner}
            >
              <Heart size={18} fill={post.currentUserWants ? "currentColor" : "none"} />
              {post.isOwner ? t("ownPost") : post.currentUserWants ? t("cancelWant") : t("want")} · {post.wantCount}
            </button>
            {post.isOwner && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Link to={`/posts/${post.id}/edit`} className="btn-secondary"><Pencil size={16} />{t("edit")}</Link>
                <button type="button" className="btn-secondary text-red-700" onClick={() => void removePost()}><Trash2 size={16} />{t("delete")}</button>
              </div>
            )}
          </div>

          <div className="card mt-5 p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><MessageCircle size={20} />{t("comments")}</h2>
            <div className="mt-5 space-y-4">
              {commentsQuery.data?.comments.map((comment) => (
                <div key={comment.id} className="rounded-2xl bg-cream-50 p-4">
                  <div className="flex justify-between gap-4 text-xs text-ink-700">
                    <strong className="text-sage-700">{comment.authorNickname}</strong>
                    <span>{new Date(comment.createdAt).toLocaleString(locale)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{comment.body}</p>
                </div>
              ))}
              {commentsQuery.data?.comments.length === 0 && <p className="text-sm text-ink-700">{t("noComments")}</p>}
            </div>
            {post.commentsEnabled ? (
              <form className="mt-5" onSubmit={addComment}>
                <textarea className="field min-h-24" name="body" maxLength={300} required placeholder={t("commentPlaceholder")} />
                {commentError && <p className="mt-2 text-sm text-red-700">{commentError}</p>}
                <button className="btn-primary mt-3">{t("sendComment")}</button>
              </form>
            ) : (
              <p className="mt-5 rounded-2xl bg-cream-50 p-4 text-sm text-ink-700">{t("commentsClosed")}</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
