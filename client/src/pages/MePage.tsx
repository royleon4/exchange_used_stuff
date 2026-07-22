import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import type { PostCard as PostCardType, PublicUser } from "../../../shared/types";
import PostCard from "../components/PostCard";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useLanguage } from "../lib/i18n";

export default function MePage() {
  const { user, isLoading, refresh } = useAuth();
  const { t } = useLanguage();
  const client = useQueryClient();
  const [nicknameBusy, setNicknameBusy] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const posts = useQuery({
    queryKey: ["me", "posts"],
    queryFn: () => api<{ posts: PostCardType[] }>("/api/me/posts"),
    enabled: !!user,
  });
  const wants = useQuery({
    queryKey: ["me", "wants"],
    queryFn: () => api<{ posts: PostCardType[] }>("/api/me/wants"),
    enabled: !!user,
  });

  async function updateNickname(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNicknameBusy(true);
    setNicknameError("");
    setNicknameMessage("");
    const nickname = new FormData(event.currentTarget).get("nickname");
    try {
      await api<{ user: PublicUser }>("/api/me/profile", {
        method: "PATCH",
        body: JSON.stringify({ nickname }),
      });
      await Promise.all([
        refresh(),
        client.invalidateQueries({ queryKey: ["posts"] }),
        client.invalidateQueries({ queryKey: ["me"] }),
      ]);
      setNicknameMessage(t("nicknameSaved"));
    } catch (value) {
      setNicknameError(value instanceof ApiError ? value.message : t("accountUpdateFailed"));
    } finally {
      setNicknameBusy(false);
    }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordBusy(true);
    setPasswordError("");
    setPasswordMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setPasswordError(t("passwordMismatch"));
      setPasswordBusy(false);
      return;
    }

    try {
      await api<void>("/api/me/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      form.reset();
      setPasswordMessage(t("passwordChanged"));
    } catch (value) {
      setPasswordError(value instanceof ApiError ? value.message : t("accountUpdateFailed"));
    } finally {
      setPasswordBusy(false);
    }
  }

  if (isLoading) return <div className="page-shell py-20 text-center">{t("loading")}</div>;
  if (!user) return <Navigate to="/login?next=/me" replace />;

  return (
    <section className="page-shell py-12 sm:py-16">
      <p className="eyebrow">{t("myCornerEyebrow")}</p>
      <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
        {t("myCornerTitle", { name: user.nickname })}
      </h1>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold">{t("accountSettings")}</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <form className="card p-6" onSubmit={updateNickname}>
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sage-50 text-sage-700">
                <UserRound size={20} />
              </span>
              <div>
                <h3 className="text-lg font-semibold">{t("profileSettings")}</h3>
                <p className="mt-1 text-sm leading-6 text-ink-700">{t("nicknameDescription")}</p>
              </div>
            </div>
            <label className="mt-5 block text-sm font-medium">
              {t("nickname")}
              <input
                key={user.nickname}
                className="field mt-2"
                name="nickname"
                defaultValue={user.nickname}
                minLength={2}
                maxLength={20}
                required
              />
            </label>
            {nicknameMessage && <p className="mt-3 rounded-2xl bg-sage-50 px-4 py-3 text-sm text-sage-700">{nicknameMessage}</p>}
            {nicknameError && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{nicknameError}</p>}
            <button className="btn-primary mt-4" disabled={nicknameBusy}>
              {nicknameBusy ? t("saving") : t("saveNickname")}
            </button>
          </form>

          <form className="card p-6" onSubmit={updatePassword}>
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sage-50 text-sage-700">
                <KeyRound size={20} />
              </span>
              <div>
                <h3 className="text-lg font-semibold">{t("passwordSettings")}</h3>
                <p className="mt-1 text-sm leading-6 text-ink-700">{t("passwordHelp")}</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium">
                {t("currentPassword")}
                <input className="field mt-2" type="password" name="currentPassword" autoComplete="current-password" required />
              </label>
              <label className="block text-sm font-medium">
                {t("newPassword")}
                <input className="field mt-2" type="password" name="newPassword" minLength={8} maxLength={72} autoComplete="new-password" required />
              </label>
              <label className="block text-sm font-medium">
                {t("confirmPassword")}
                <input className="field mt-2" type="password" name="confirmPassword" minLength={8} maxLength={72} autoComplete="new-password" required />
              </label>
            </div>
            {passwordMessage && <p className="mt-3 rounded-2xl bg-sage-50 px-4 py-3 text-sm text-sage-700">{passwordMessage}</p>}
            {passwordError && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{passwordError}</p>}
            <button className="btn-primary mt-4" disabled={passwordBusy}>
              {passwordBusy ? t("changingPassword") : t("changePassword")}
            </button>
          </form>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{t("myPosts")}</h2>
            <p className="mt-1 text-sm text-ink-700">{t("publishedItems")} · {posts.data?.posts.length ?? 0}</p>
          </div>
          <Link to="/posts/new" className="btn-secondary">{t("publishItem")}</Link>
        </div>
        {posts.isLoading && <div className="card mt-5 p-8 text-center text-ink-700">{t("loading")}</div>}
        {posts.data?.posts.length === 0 && <div className="card mt-5 p-8 text-center text-ink-700">{t("myPostsEmpty")}</div>}
        {!!posts.data?.posts.length && (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.data.posts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </section>

      <section className="mt-12">
        <div>
          <h2 className="text-2xl font-semibold">{t("wantedItems")}</h2>
          <p className="mt-1 text-sm text-ink-700">{t("expressedInterest")} · {wants.data?.posts.length ?? 0}</p>
        </div>
        {wants.isLoading && <div className="card mt-5 p-8 text-center text-ink-700">{t("loading")}</div>}
        {wants.data?.posts.length === 0 && (
          <div className="card mt-5 p-8 text-center text-ink-700">
            <p>{t("wantedItemsEmpty")}</p>
            <Link to="/items" className="btn-secondary mt-4">{t("browseItems")}</Link>
          </div>
        )}
        {!!wants.data?.posts.length && (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {wants.data.posts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </section>
    </section>
  );
}
