import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import type { ItemStatus, PostDetail, PostImageView } from "../../../shared/types";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useLanguage } from "../lib/i18n";

type UploadedImage = Omit<PostImageView, "sortOrder">;

export default function EditPostPage() {
  const { id } = useParams();
  const { user, isLoading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const client = useQueryClient();
  const initializedPostId = useRef<number | null>(null);
  const [images, setImages] = useState<PostImageView[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [itemStatus, setItemStatus] = useState<ItemStatus>("considering");
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const remainingSlots = useMemo(() => 9 - images.length, [images.length]);

  const postQuery = useQuery({
    queryKey: ["post", id],
    queryFn: () => api<{ post: PostDetail }>(`/api/posts/${id}`),
    enabled: Boolean(user && id),
  });

  useEffect(() => {
    const post = postQuery.data?.post;
    if (!post || initializedPostId.current === post.id) return;

    initializedPostId.current = post.id;
    setImages([...post.images].sort((left, right) => left.sortOrder - right.sortOrder));
    setTitle(post.title);
    setDescription(post.description);
    setItemStatus(post.itemStatus);
    setCommentsEnabled(post.commentsEnabled);
  }, [postQuery.data]);

  if (isLoading) return <div className="page-shell py-20 text-center">{t("loading")}</div>;
  if (!user) return <Navigate to={`/login?next=/posts/${id}/edit`} replace />;
  if (postQuery.isLoading) return <div className="page-shell py-20 text-center">{t("loading")}</div>;

  if (postQuery.isError || !postQuery.data) {
    return (
      <section className="page-shell py-16">
        <div className="card mx-auto max-w-2xl p-8">
          <h1 className="font-display text-4xl font-semibold">{t("postNotFound")}</h1>
          <Link to="/me" className="btn-primary mt-6">{t("backToCollection")}</Link>
        </div>
      </section>
    );
  }

  const post = postQuery.data.post;
  if (!post.isOwner) {
    return (
      <section className="page-shell py-16">
        <div className="card mx-auto max-w-2xl p-8">
          <h1 className="font-display text-4xl font-semibold">{t("editPostTitle")}</h1>
          <p className="mt-4 text-ink-700">
            {language === "zh" ? "只能編輯自己發布的物品。" : "You can only edit items you posted."}
          </p>
          <Link to={`/posts/${post.id}`} className="btn-primary mt-6">
            {language === "zh" ? "返回物品" : "Back to Item"}
          </Link>
        </div>
      </section>
    );
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length || remainingSlots <= 0) return;
    setError("");
    setUploading(true);
    try {
      const selected = Array.from(files).slice(0, remainingSlots);
      const body = new FormData();
      selected.forEach((file) => body.append("images", file));
      const result = await api<{ images: UploadedImage[] }>("/api/uploads/images", {
        method: "POST",
        body,
      });
      setImages((current) => [
        ...current,
        ...result.images.map((image, index) => ({
          ...image,
          sortOrder: current.length + index,
        })),
      ].slice(0, 9));
    } catch (value) {
      setError(value instanceof ApiError ? value.message : t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (images.length === 0) {
      setError(t("imageRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await api(`/api/posts/${post.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          description,
          commentsEnabled,
          itemStatus,
          imageIds: images.map((image) => image.id),
        }),
      });
      await Promise.all([
        client.invalidateQueries({ queryKey: ["post", String(post.id)] }),
        client.invalidateQueries({ queryKey: ["posts"] }),
        client.invalidateQueries({ queryKey: ["me", "posts"] }),
        client.invalidateQueries({ queryKey: ["me", "wants"] }),
      ]);
      navigate(`/posts/${post.id}`);
    } catch (value) {
      setError(
        value instanceof ApiError
          ? value.message
          : language === "zh"
            ? "儲存修改失敗，請稍後再試。"
            : "Could not save the changes. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-shell py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">{t("shareEyebrow")}</p>
        <h1 className="mt-3 font-display text-5xl font-semibold">{t("editPostTitle")}</h1>
        <p className="mt-4 leading-7 text-ink-700">
          {language === "zh"
            ? "更新物品內容、照片與目前狀態。"
            : "Update the item details, photos, and current status."}
        </p>

        <form className="card mt-8 space-y-8 p-6 sm:p-9" onSubmit={submit}>
          <section>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">{t("itemPhotos")}</h2>
                <p className="mt-1 text-sm text-ink-700">{t("itemPhotosHelp")}</p>
              </div>
              <span className="text-sm text-ink-700">{images.length}/9</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image, index) => (
                <div key={image.id} className="relative aspect-square overflow-hidden rounded-2xl bg-sage-50">
                  <img src={image.url} alt={`${t("itemPhotos")} ${index + 1}`} className="h-full w-full object-cover" />
                  {index === 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-sage-700">
                      {t("cover")}
                    </span>
                  )}
                  <button
                    type="button"
                    className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-ink-900/70 text-white"
                    onClick={() => setImages((current) => current.filter((item) => item.id !== image.id))}
                    aria-label={`${t("delete")} ${index + 1}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {remainingSlots > 0 && (
                <label className="grid aspect-square cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-sage-100 bg-sage-50/50 text-center text-sage-700 transition hover:bg-sage-50">
                  <span className="px-3">
                    <ImagePlus className="mx-auto" />
                    <span className="mt-2 block text-sm font-semibold">
                      {uploading ? t("uploading") : t("addPhoto")}
                    </span>
                  </span>
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={uploading}
                    onChange={(event) => void uploadFiles(event.target.files)}
                  />
                </label>
              )}
            </div>
          </section>

          <label className="block text-sm font-medium">
            {t("title")} <span className="float-right font-normal text-ink-700">{title.length}/40</span>
            <input
              className="field mt-2"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={3}
              maxLength={40}
              required
              placeholder={t("titlePlaceholder")}
            />
          </label>
          <label className="block text-sm font-medium">
            {t("description")}{" "}
            <span className="float-right font-normal text-ink-700">
              {language === "zh" ? "選填・不限字數" : "Optional · no character limit"}
            </span>
            <textarea
              className="field mt-2 min-h-36 resize-y"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("descriptionPlaceholder")}
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              {t("currentThought")}
              <select
                className="field mt-2"
                value={itemStatus}
                onChange={(event) => setItemStatus(event.target.value as ItemStatus)}
              >
                <option value="considering">{t("statusConsidering")}</option>
                <option value="bringing">{t("statusBringing")}</option>
                <option value="not_bringing">{t("statusNotBringing")}</option>
                <option value="closed">{t("statusClosed")}</option>
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={commentsEnabled}
                onChange={(event) => setCommentsEnabled(event.target.checked)}
                className="size-4 accent-sage-600"
              />
              {t("allowComments")}
            </label>
          </div>

          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={() => navigate(`/posts/${post.id}`)}>
              {t("cancel")}
            </button>
            <button className="btn-primary" disabled={submitting || uploading}>
              {submitting ? (
                <>
                  <LoaderCircle className="animate-spin" size={17} />
                  {language === "zh" ? "儲存中…" : "Saving…"}
                </>
              ) : language === "zh" ? "儲存修改" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
