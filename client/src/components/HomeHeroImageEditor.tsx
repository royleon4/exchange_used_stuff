import { useMutation } from "@tanstack/react-query";
import { ImagePlus, Palette, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { PublicSiteSettings } from "../../../shared/types";
import { api, ApiError } from "../lib/api";

type Labels = {
  title: string;
  help: string;
  empty: string;
  upload: string;
  replace: string;
  remove: string;
  uploading: string;
  removing: string;
  saved: string;
  removed: string;
  failed: string;
};

type Props = {
  settings: PublicSiteSettings;
  labels: Labels;
  onSettingsChange: (settings: PublicSiteSettings) => void;
  onSaved: (message: string) => Promise<void>;
};

export default function HomeHeroImageEditor({ settings, labels, onSettingsChange, onSaved }: Props) {
  const [error, setError] = useState("");
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  async function applyImageSettings(nextSettings: PublicSiteSettings, message: string) {
    setError("");

    // Refresh the shared settings first, then restore any text the administrator
    // is still editing locally. Only the image fields should change here.
    await onSaved(message);
    onSettingsChange({
      ...settingsRef.current,
      homeHeroImageId: nextSettings.homeHeroImageId,
      homeHeroImageUrl: nextSettings.homeHeroImageUrl,
      updatedAt: nextSettings.updatedAt,
    });
  }

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("images", file);
      const uploaded = await api<{ images: Array<{ id: number }> }>("/api/upload/images", {
        method: "POST",
        body,
      });
      const image = uploaded.images[0];
      if (!image) throw new Error("IMAGE_UPLOAD_EMPTY");

      return api<{ settings: PublicSiteSettings }>("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ homeHeroImageId: image.id }),
      });
    },
    onSuccess: ({ settings: nextSettings }) => applyImageSettings(nextSettings, labels.saved),
    onError: (value) => setError(value instanceof ApiError ? value.message : labels.failed),
  });

  const removeMutation = useMutation({
    mutationFn: () => api<{ settings: PublicSiteSettings }>("/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({ homeHeroImageId: null }),
    }),
    onSuccess: ({ settings: nextSettings }) => applyImageSettings(nextSettings, labels.removed),
    onError: (value) => setError(value instanceof ApiError ? value.message : labels.failed),
  });

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) uploadMutation.mutate(file);
  }

  function updateColor(key: "homeTitleColor" | "homeTitleAccentColor", value: string) {
    onSettingsChange({ ...settings, [key]: value.toUpperCase() });
  }

  const busy = uploadMutation.isPending || removeMutation.isPending;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{labels.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-700">{labels.help}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={`btn-primary cursor-pointer ${busy ? "pointer-events-none opacity-50" : ""}`}>
            <ImagePlus size={17} />
            {uploadMutation.isPending ? labels.uploading : settings.homeHeroImageUrl ? labels.replace : labels.upload}
            <input
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={selectFile}
            />
          </label>
          {settings.homeHeroImageUrl && (
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => removeMutation.mutate()}
            >
              <Trash2 size={17} />
              {removeMutation.isPending ? labels.removing : labels.remove}
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 flex min-h-36 items-center justify-center overflow-hidden rounded-3xl border border-cream-200 bg-cream-50 p-4 sm:min-h-44">
        {settings.homeHeroImageUrl ? (
          <img
            src={settings.homeHeroImageUrl}
            alt=""
            className="max-h-48 w-full object-contain"
          />
        ) : (
          <p className="text-sm text-ink-700">{labels.empty}</p>
        )}
      </div>

      <div className="mt-6 border-t border-cream-200 pt-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-sage-50 text-sage-700">
            <Palette size={19} aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-semibold text-ink-900">首頁標題顏色 / Homepage title colors</h3>
            <p className="mt-1 text-sm leading-6 text-ink-700">點選色塊選擇顏色，完成後請按頁面下方的「儲存首頁與公告」。</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="rounded-3xl bg-cream-50 p-4 text-sm font-medium text-ink-900">
            一般標題 / Main title
            <span className="mt-3 flex items-center gap-3">
              <input
                type="color"
                className="size-12 cursor-pointer rounded-2xl border border-cream-200 bg-white p-1"
                value={settings.homeTitleColor}
                aria-label="一般標題顏色"
                onChange={(event) => updateColor("homeTitleColor", event.target.value)}
              />
              <span className="font-mono text-sm uppercase text-ink-700">{settings.homeTitleColor}</span>
            </span>
          </label>

          <label className="rounded-3xl bg-cream-50 p-4 text-sm font-medium text-ink-900">
            重點文字 / Highlight
            <span className="mt-3 flex items-center gap-3">
              <input
                type="color"
                className="size-12 cursor-pointer rounded-2xl border border-cream-200 bg-white p-1"
                value={settings.homeTitleAccentColor}
                aria-label="重點文字顏色"
                onChange={(event) => updateColor("homeTitleAccentColor", event.target.value)}
              />
              <span className="font-mono text-sm uppercase text-ink-700">{settings.homeTitleAccentColor}</span>
            </span>
          </label>
        </div>

        <div className="mt-4 rounded-3xl border border-cream-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700">Preview</p>
          <p className="mt-3 font-display text-3xl font-semibold leading-tight" style={{ color: settings.homeTitleColor }}>
            讓好物在婚禮這天， <span style={{ color: settings.homeTitleAccentColor }}>遇見下一個喜歡它的人。</span>
          </p>
        </div>
      </div>

      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}