import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useLanguage } from "../lib/i18n";

type UploadedImage = { id: number; url: string; width: number; height: number };

export default function NewPostPage() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const remainingSlots = useMemo(() => 9 - images.length, [images.length]);

  if (isLoading) return <div className="page-shell py-20 text-center">{t("loading")}</div>;
  if (!user) return <Navigate to="/login?next=/posts/new" replace />;

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setUploading(true);
    try {
      const selected = Array.from(files).slice(0, remainingSlots);
      const body = new FormData();
      selected.forEach((file) => body.append("images", file));
      const result = await api<{ images: UploadedImage[] }>("/api/uploads/images", { method: "POST", body });
      setImages((current) => [...current, ...result.images].slice(0, 9));
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
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ post: { id: number } }>("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          commentsEnabled: form.get("commentsEnabled") === "on",
          itemStatus: form.get("itemStatus"),
          imageIds: images.map((image) => image.id),
        }),
      });
      navigate(`/posts/${result.post.id}`);
    } catch (value) {
      setError(value instanceof ApiError ? value.message : t("publishFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-shell py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">{t("shareEyebrow")}</p>
        <h1 className="mt-3 font-display text-5xl font-semibold">{t("newPostTitle")}</h1>
        <p className="mt-4 leading-7 text-ink-700">{t("newPostDescription")}</p>

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
                  {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-sage-700">{t("cover")}</span>}
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
                    <span className="mt-2 block text-sm font-semibold">{uploading ? t("uploading") : t("addPhoto")}</span>
                  </span>
                  <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} onChange={(event) => void uploadFiles(event.target.files)} />
                </label>
              )}
            </div>
          </section>

          <label className="block text-sm font-medium">
            {t("title")} <span className="float-right font-normal text-ink-700">{title.length}/40</span>
            <input className="field mt-2" value={title} onChange={(event) => setTitle(event.target.value)} minLength={2} maxLength={40} required placeholder={t("titlePlaceholder")} />
          </label>
          <label className="block text-sm font-medium">
            {t("description")} <span className="float-right font-normal text-ink-700">{description.length}/500</span>
            <textarea className="field mt-2 min-h-36 resize-y" value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={500} required placeholder={t("descriptionPlaceholder")} />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              {t("currentThought")}
              <select className="field mt-2" name="itemStatus" defaultValue="considering">
                <option value="considering">{t("statusConsidering")}</option>
                <option value="bringing">{t("statusBringing")}</option>
                <option value="not_bringing">{t("statusNotBringing")}</option>
                <option value="closed">{t("statusClosed")}</option>
              </select>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm font-medium">
              <input type="checkbox" name="commentsEnabled" defaultChecked className="size-4 accent-sage-600" />
              {t("allowComments")}
            </label>
          </div>

          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>{t("cancel")}</button>
            <button className="btn-primary" disabled={submitting || uploading}>
              {submitting ? <><LoaderCircle className="animate-spin" size={17} />{t("publishing")}</> : t("publish")}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
