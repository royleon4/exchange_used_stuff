import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

type UploadedImage = { id: number; url: string; width: number; height: number };

export default function NewPostPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const remainingSlots = useMemo(() => 9 - images.length, [images.length]);

  if (isLoading) return <div className="page-shell py-20 text-center">讀取中…</div>;
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
      setError(value instanceof ApiError ? value.message : "圖片上傳失敗，請稍後再試");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (images.length === 0) {
      setError("請先上傳至少一張圖片");
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
      setError(value instanceof ApiError ? value.message : "發布失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-shell py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Share an Item</p>
        <h1 className="mt-3 font-display text-5xl font-semibold">發布可能帶來的物品</h1>
        <p className="mt-4 leading-7 text-ink-700">先看看有沒有人感興趣，再決定是否把它帶到婚禮現場。</p>

        <form className="card mt-8 space-y-8 p-6 sm:p-9" onSubmit={submit}>
          <section>
            <div className="flex items-center justify-between gap-4">
              <div><h2 className="font-semibold">物品照片</h2><p className="mt-1 text-sm text-ink-700">至少 1 張，最多 9 張；第一張會成為封面。</p></div>
              <span className="text-sm text-ink-700">{images.length}/9</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image, index) => (
                <div key={image.id} className="relative aspect-square overflow-hidden rounded-2xl bg-sage-50">
                  <img src={image.url} alt={`上傳圖片 ${index + 1}`} className="h-full w-full object-cover" />
                  {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-sage-700">封面</span>}
                  <button type="button" className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-ink-900/70 text-white" onClick={() => setImages((current) => current.filter((item) => item.id !== image.id))} aria-label="移除圖片"><X size={16} /></button>
                </div>
              ))}
              {remainingSlots > 0 && (
                <label className="grid aspect-square cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-sage-100 bg-sage-50/50 text-center text-sage-700 transition hover:bg-sage-50">
                  <span className="px-3"><ImagePlus className="mx-auto" /><span className="mt-2 block text-sm font-semibold">{uploading ? "上傳中…" : "加入照片"}</span></span>
                  <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} onChange={(event) => void uploadFiles(event.target.files)} />
                </label>
              )}
            </div>
          </section>

          <label className="block text-sm font-medium">標題 <span className="float-right font-normal text-ink-700">{title.length}/40</span><input className="field mt-2" value={title} onChange={(event) => setTitle(event.target.value)} minLength={2} maxLength={40} required placeholder="例如：保存良好的手沖咖啡壺" /></label>
          <label className="block text-sm font-medium">描述 <span className="float-right font-normal text-ink-700">{description.length}/500</span><textarea className="field mt-2 min-h-36 resize-y" value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={500} required placeholder="說明物品狀況、尺寸，或希望大家知道的細節。" /></label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">目前想法<select className="field mt-2" name="itemStatus" defaultValue="considering"><option value="considering">還在考慮</option><option value="bringing">確定帶來</option><option value="not_bringing">這次不帶</option><option value="closed">已結束</option></select></label>
            <label className="flex items-center gap-3 rounded-2xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm font-medium"><input type="checkbox" name="commentsEnabled" defaultChecked className="size-4 accent-sage-600" />允許其他賓客留言</label>
          </div>

          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>取消</button>
            <button className="btn-primary" disabled={submitting || uploading}>{submitting ? <><LoaderCircle className="animate-spin" size={17} />發布中…</> : "發布物品"}</button>
          </div>
        </form>
      </div>
    </section>
  );
}
