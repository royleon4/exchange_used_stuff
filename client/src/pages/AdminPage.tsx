import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, MessageSquareText, Settings, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import type { PublicSiteSettings } from "../../../shared/types";
import HomeHeroImageEditor from "../components/HomeHeroImageEditor";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useLanguage } from "../lib/i18n";

type AdminUser = {
  id: number;
  username: string;
  nickname: string;
  role: "user" | "admin";
  isActive: boolean;
  createdAt: string;
  postCount: number;
  commentCount: number;
  wantCount: number;
};

type AdminPost = {
  id: number;
  authorId: number;
  authorNickname: string;
  title: string;
  description: string;
  itemStatus: "considering" | "bringing" | "not_bringing" | "closed";
  commentsEnabled: boolean;
  moderationStatus: "visible" | "hidden" | "deleted";
  coverImageId: number | null;
  wantCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type AdminComment = {
  id: number;
  postId: number;
  postTitle: string;
  authorNickname: string;
  body: string;
  moderationStatus: "visible" | "hidden" | "deleted";
  createdAt: string;
};

type Tab = "users" | "posts" | "comments" | "content";

const copyByLanguage = {
  zh: {
    title: "管理後台",
    subtitle: "管理會員、貼文、留言、首頁文字與公告。",
    users: "會員管理",
    posts: "貼文管理",
    comments: "留言管理",
    content: "首頁與公告",
    loading: "正在讀取管理資料…",
    loadError: "目前無法讀取管理資料。",
    nickname: "公開暱稱",
    username: "登入帳號",
    role: "角色",
    member: "一般會員",
    admin: "管理員",
    active: "帳號可使用",
    resetPassword: "重設密碼（留白則不修改）",
    passwordHelp: "重設密碼至少 8 個字元。",
    saveUser: "儲存會員",
    userSaved: "會員資料已更新",
    joined: "加入時間",
    userStats: "{{posts}} 篇貼文・{{comments}} 則留言・{{wants}} 個收藏",
    titleLabel: "標題",
    description: "描述",
    itemStatus: "物品狀態",
    considering: "還在考慮",
    bringing: "確定帶來",
    notBringing: "這次不帶",
    closed: "已結束",
    moderation: "公開狀態",
    visible: "公開",
    hidden: "隱藏",
    deleted: "刪除",
    commentsEnabled: "允許留言",
    savePost: "儲存貼文",
    postSaved: "貼文已更新",
    openPost: "查看貼文",
    postStats: "{{wants}} 人想要・{{comments}} 則留言",
    commentSaved: "留言狀態已更新",
    saveStatus: "更新狀態",
    noData: "目前沒有資料。",
    siteTitle: "網站名稱",
    homeImage: "首頁橫幅圖片",
    homeImageHelp: "顯示在導覽列與首頁標題之間。建議使用橫式圖片（約 1600 × 450），支援 JPG、PNG、WebP，單張上限 8 MB。",
    homeImageEmpty: "目前沒有首頁圖片。",
    homeImageUpload: "上傳圖片",
    homeImageReplace: "更換圖片",
    homeImageRemove: "移除圖片",
    homeImageUploading: "上傳中…",
    homeImageRemoving: "移除中…",
    homeImageSaved: "首頁圖片已更新",
    homeImageRemoved: "首頁圖片已移除",
    homeImageFailed: "圖片處理失敗，請重新嘗試。",
    homeZh: "首頁中文",
    homeEn: "首頁英文",
    titleStart: "主標題前段",
    titleAccent: "主標題重點",
    homeDescription: "首頁介紹",
    announcement: "中文公告",
    announcementEn: "英文公告",
    announcementEnabled: "顯示公告",
    registrationOpen: "開放新會員註冊",
    defaultComments: "新貼文預設開放留言",
    saveContent: "儲存首頁與公告",
    contentSaved: "首頁文字與公告已更新",
    saving: "儲存中…",
    saveFailed: "儲存失敗，請重新嘗試。",
    signedIn: "登入者：{{name}}",
    currentAccount: "目前登入帳號",
  },
  en: {
    title: "Admin Dashboard",
    subtitle: "Manage members, posts, comments, homepage copy, and announcements.",
    users: "Members",
    posts: "Posts",
    comments: "Comments",
    content: "Homepage & Announcement",
    loading: "Loading admin data…",
    loadError: "Admin data cannot be loaded right now.",
    nickname: "Public nickname",
    username: "Login username",
    role: "Role",
    member: "Member",
    admin: "Admin",
    active: "Account enabled",
    resetPassword: "Reset password (leave blank to keep it)",
    passwordHelp: "A reset password must contain at least 8 characters.",
    saveUser: "Save Member",
    userSaved: "Member updated",
    joined: "Joined",
    userStats: "{{posts}} posts · {{comments}} comments · {{wants}} saved items",
    titleLabel: "Title",
    description: "Description",
    itemStatus: "Item status",
    considering: "Considering",
    bringing: "Bringing It",
    notBringing: "Not Bringing",
    closed: "Closed",
    moderation: "Visibility",
    visible: "Visible",
    hidden: "Hidden",
    deleted: "Deleted",
    commentsEnabled: "Allow comments",
    savePost: "Save Post",
    postSaved: "Post updated",
    openPost: "Open post",
    postStats: "{{wants}} interested · {{comments}} comments",
    commentSaved: "Comment status updated",
    saveStatus: "Update Status",
    noData: "No data yet.",
    siteTitle: "Site name",
    homeImage: "Homepage banner image",
    homeImageHelp: "Shown between the navigation and homepage headline. A wide image around 1600 × 450 is recommended. JPG, PNG, and WebP up to 8 MB are supported.",
    homeImageEmpty: "No homepage image has been uploaded.",
    homeImageUpload: "Upload Image",
    homeImageReplace: "Replace Image",
    homeImageRemove: "Remove Image",
    homeImageUploading: "Uploading…",
    homeImageRemoving: "Removing…",
    homeImageSaved: "Homepage image updated",
    homeImageRemoved: "Homepage image removed",
    homeImageFailed: "The image could not be processed. Please try again.",
    homeZh: "Chinese homepage",
    homeEn: "English homepage",
    titleStart: "Headline opening",
    titleAccent: "Headline highlight",
    homeDescription: "Homepage introduction",
    announcement: "Chinese announcement",
    announcementEn: "English announcement",
    announcementEnabled: "Show announcement",
    registrationOpen: "Allow new registrations",
    defaultComments: "Enable comments by default on new posts",
    saveContent: "Save Homepage & Announcement",
    contentSaved: "Homepage and announcement updated",
    saving: "Saving…",
    saveFailed: "Could not save. Please try again.",
    signedIn: "Signed in as {{name}}",
    currentAccount: "Current account",
  },
} as const;

type Copy = (typeof copyByLanguage)["zh"];

function text(template: string, values: Record<string, string | number>) {
  return template.replace(/{{(\w+)}}/g, (_match, key: string) => String(values[key] ?? ""));
}

function UserEditor({
  item,
  currentUserId,
  copy,
  onSaved,
}: {
  item: AdminUser;
  currentUserId: number;
  copy: Copy;
  onSaved: (message: string) => Promise<void>;
}) {
  const [nickname, setNickname] = useState(item.nickname);
  const [role, setRole] = useState(item.role);
  const [isActive, setIsActive] = useState(item.isActive);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: () => api(`/api/admin/users/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        nickname,
        role,
        isActive,
        ...(newPassword ? { newPassword } : {}),
      }),
    }),
    onSuccess: async () => {
      setNewPassword("");
      setError("");
      await onSaved(copy.userSaved);
    },
    onError: (value) => setError(value instanceof ApiError ? value.message : copy.saveFailed),
  });

  return (
    <article className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{copy.username}</p>
          <h3 className="mt-1 text-xl font-semibold">{item.username}</h3>
          <p className="mt-2 text-xs text-ink-700">
            {copy.joined}：{new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>
        {item.id === currentUserId && (
          <span className="rounded-full bg-sage-50 px-3 py-1 text-xs font-semibold text-sage-700">{copy.currentAccount}</span>
        )}
      </div>
      <p className="mt-4 rounded-2xl bg-cream-50 px-4 py-3 text-sm text-ink-700">
        {text(copy.userStats, { posts: item.postCount, comments: item.commentCount, wants: item.wantCount })}
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          {copy.nickname}
          <input className="field mt-2" value={nickname} minLength={2} maxLength={20} onChange={(event) => setNickname(event.target.value)} />
        </label>
        <label className="text-sm font-medium">
          {copy.role}
          <select className="field mt-2" value={role} disabled={item.id === currentUserId} onChange={(event) => setRole(event.target.value as AdminUser["role"])}>
            <option value="user">{copy.member}</option>
            <option value="admin">{copy.admin}</option>
          </select>
        </label>
      </div>
      <label className="mt-4 flex items-center gap-3 rounded-2xl bg-cream-50 px-4 py-3 text-sm font-medium">
        <input type="checkbox" checked={isActive} disabled={item.id === currentUserId} onChange={(event) => setIsActive(event.target.checked)} />
        {copy.active}
      </label>
      <label className="mt-4 block text-sm font-medium">
        {copy.resetPassword}
        <input className="field mt-2" type="password" minLength={8} maxLength={72} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        <span className="mt-1 block text-xs text-ink-700">{copy.passwordHelp}</span>
      </label>
      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <button type="button" className="btn-primary mt-4" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
        {mutation.isPending ? copy.saving : copy.saveUser}
      </button>
    </article>
  );
}

function PostEditor({ item, copy, onSaved }: { item: AdminPost; copy: Copy; onSaved: (message: string) => Promise<void> }) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [itemStatus, setItemStatus] = useState(item.itemStatus);
  const [moderationStatus, setModerationStatus] = useState(item.moderationStatus);
  const [commentsEnabled, setCommentsEnabled] = useState(item.commentsEnabled);
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: () => api(`/api/admin/posts/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ title, description, itemStatus, moderationStatus, commentsEnabled }),
    }),
    onSuccess: async () => {
      setError("");
      await onSaved(copy.postSaved);
    },
    onError: (value) => setError(value instanceof ApiError ? value.message : copy.saveFailed),
  });

  return (
    <article className="card overflow-hidden">
      <div className="grid md:grid-cols-[180px_1fr]">
        <div className="min-h-44 bg-sage-50">
          {item.coverImageId ? <img src={`/api/media/${item.coverImageId}`} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">{item.authorNickname}</p>
              <p className="mt-2 text-xs text-ink-700">{text(copy.postStats, { wants: item.wantCount, comments: item.commentCount })}</p>
            </div>
            <Link to={`/posts/${item.id}`} className="btn-secondary !py-2">{copy.openPost}</Link>
          </div>
          <label className="mt-5 block text-sm font-medium">
            {copy.titleLabel}
            <input className="field mt-2" value={title} minLength={2} maxLength={40} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="mt-4 block text-sm font-medium">
            {copy.description}
            <textarea className="field mt-2 min-h-28" value={description} minLength={10} maxLength={500} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              {copy.itemStatus}
              <select className="field mt-2" value={itemStatus} onChange={(event) => setItemStatus(event.target.value as AdminPost["itemStatus"])}>
                <option value="considering">{copy.considering}</option>
                <option value="bringing">{copy.bringing}</option>
                <option value="not_bringing">{copy.notBringing}</option>
                <option value="closed">{copy.closed}</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              {copy.moderation}
              <select className="field mt-2" value={moderationStatus} onChange={(event) => setModerationStatus(event.target.value as AdminPost["moderationStatus"])}>
                <option value="visible">{copy.visible}</option>
                <option value="hidden">{copy.hidden}</option>
                <option value="deleted">{copy.deleted}</option>
              </select>
            </label>
          </div>
          <label className="mt-4 flex items-center gap-3 rounded-2xl bg-cream-50 px-4 py-3 text-sm font-medium">
            <input type="checkbox" checked={commentsEnabled} onChange={(event) => setCommentsEnabled(event.target.checked)} />
            {copy.commentsEnabled}
          </label>
          {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button type="button" className="btn-primary mt-4" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? copy.saving : copy.savePost}
          </button>
        </div>
      </div>
    </article>
  );
}

function CommentEditor({ item, copy, onSaved }: { item: AdminComment; copy: Copy; onSaved: (message: string) => Promise<void> }) {
  const [status, setStatus] = useState(item.moderationStatus);
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: () => api(`/api/admin/comments/${item.id}/moderation`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
    onSuccess: async () => {
      setError("");
      await onSaved(copy.commentSaved);
    },
    onError: (value) => setError(value instanceof ApiError ? value.message : copy.saveFailed),
  });

  return (
    <article className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{item.authorNickname}</p>
          <Link to={`/posts/${item.postId}`} className="mt-2 block font-semibold text-sage-700">{item.postTitle}</Link>
        </div>
        <span className="text-xs text-ink-700">{new Date(item.createdAt).toLocaleString()}</span>
      </div>
      <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-cream-50 p-4 text-sm leading-6">{item.body}</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-44 flex-1 text-sm font-medium">
          {copy.moderation}
          <select className="field mt-2" value={status} onChange={(event) => setStatus(event.target.value as AdminComment["moderationStatus"])}>
            <option value="visible">{copy.visible}</option>
            <option value="hidden">{copy.hidden}</option>
            <option value="deleted">{copy.deleted}</option>
          </select>
        </label>
        <button type="button" className="btn-primary" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? copy.saving : copy.saveStatus}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </article>
  );
}

function ContentEditor({ settings, copy, onSaved }: { settings: PublicSiteSettings; copy: Copy; onSaved: (message: string) => Promise<void> }) {
  const [form, setForm] = useState(settings);
  const [error, setError] = useState("");
  useEffect(() => setForm(settings), [settings]);
  const mutation = useMutation({
    mutationFn: () => api("/api/admin/settings", { method: "PATCH", body: JSON.stringify(form) }),
    onSuccess: async () => {
      setError("");
      await onSaved(copy.contentSaved);
    },
    onError: (value) => setError(value instanceof ApiError ? value.message : copy.saveFailed),
  });

  function update<K extends keyof PublicSiteSettings>(key: K, value: PublicSiteSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <form className="space-y-6" onSubmit={submit}>
      <section className="card p-5 sm:p-6">
        <label className="block text-sm font-medium">
          {copy.siteTitle}
          <input className="field mt-2" value={form.siteTitle} maxLength={80} onChange={(event) => update("siteTitle", event.target.value)} />
        </label>
      </section>

      <HomeHeroImageEditor
        settings={form}
        onSettingsChange={setForm}
        onSaved={onSaved}
        labels={{
          title: copy.homeImage,
          help: copy.homeImageHelp,
          empty: copy.homeImageEmpty,
          upload: copy.homeImageUpload,
          replace: copy.homeImageReplace,
          remove: copy.homeImageRemove,
          uploading: copy.homeImageUploading,
          removing: copy.homeImageRemoving,
          saved: copy.homeImageSaved,
          removed: copy.homeImageRemoved,
          failed: copy.homeImageFailed,
        }}
      />

      <section className="card p-5 sm:p-6">
        <h2 className="text-xl font-semibold">{copy.homeZh}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">{copy.titleStart}<input className="field mt-2" value={form.homeTitleStartZh} maxLength={100} onChange={(event) => update("homeTitleStartZh", event.target.value)} /></label>
          <label className="text-sm font-medium">{copy.titleAccent}<input className="field mt-2" value={form.homeTitleAccentZh} maxLength={100} onChange={(event) => update("homeTitleAccentZh", event.target.value)} /></label>
        </div>
        <label className="mt-4 block text-sm font-medium">{copy.homeDescription}<textarea className="field mt-2 min-h-28" value={form.homeDescriptionZh} maxLength={500} onChange={(event) => update("homeDescriptionZh", event.target.value)} /></label>
      </section>
      <section className="card p-5 sm:p-6">
        <h2 className="text-xl font-semibold">{copy.homeEn}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">{copy.titleStart}<input className="field mt-2" value={form.homeTitleStartEn} maxLength={140} onChange={(event) => update("homeTitleStartEn", event.target.value)} /></label>
          <label className="text-sm font-medium">{copy.titleAccent}<input className="field mt-2" value={form.homeTitleAccentEn} maxLength={140} onChange={(event) => update("homeTitleAccentEn", event.target.value)} /></label>
        </div>
        <label className="mt-4 block text-sm font-medium">{copy.homeDescription}<textarea className="field mt-2 min-h-28" value={form.homeDescriptionEn} maxLength={700} onChange={(event) => update("homeDescriptionEn", event.target.value)} /></label>
      </section>
      <section className="card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">{copy.announcement}<textarea className="field mt-2 min-h-24" value={form.announcement} maxLength={500} onChange={(event) => update("announcement", event.target.value)} /></label>
          <label className="text-sm font-medium">{copy.announcementEn}<textarea className="field mt-2 min-h-24" value={form.announcementEn} maxLength={700} onChange={(event) => update("announcementEn", event.target.value)} /></label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-3 rounded-2xl bg-cream-50 px-4 py-3 text-sm font-medium"><input type="checkbox" checked={form.announcementEnabled} onChange={(event) => update("announcementEnabled", event.target.checked)} />{copy.announcementEnabled}</label>
          <label className="flex items-center gap-3 rounded-2xl bg-cream-50 px-4 py-3 text-sm font-medium"><input type="checkbox" checked={form.registrationOpen} onChange={(event) => update("registrationOpen", event.target.checked)} />{copy.registrationOpen}</label>
          <label className="flex items-center gap-3 rounded-2xl bg-cream-50 px-4 py-3 text-sm font-medium"><input type="checkbox" checked={form.defaultCommentsEnabled} onChange={(event) => update("defaultCommentsEnabled", event.target.checked)} />{copy.defaultComments}</label>
        </div>
      </section>
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <button className="btn-primary" disabled={mutation.isPending}>{mutation.isPending ? copy.saving : copy.saveContent}</button>
    </form>
  );
}

export default function AdminPage() {
  const { user, isLoading, refresh } = useAuth();
  const { language } = useLanguage();
  const copy = copyByLanguage[language] as Copy;
  const client = useQueryClient();
  const [tab, setTab] = useState<Tab>("users");
  const [notice, setNotice] = useState("");
  const enabled = user?.role === "admin";

  const usersQuery = useQuery({ queryKey: ["admin", "users"], queryFn: () => api<{ users: AdminUser[] }>("/api/admin/users"), enabled });
  const postsQuery = useQuery({ queryKey: ["admin", "posts"], queryFn: () => api<{ posts: AdminPost[] }>("/api/admin/posts"), enabled });
  const commentsQuery = useQuery({ queryKey: ["admin", "comments"], queryFn: () => api<{ comments: AdminComment[] }>("/api/admin/comments"), enabled });
  const settingsQuery = useQuery({ queryKey: ["admin", "settings"], queryFn: () => api<{ settings: PublicSiteSettings }>("/api/admin/settings"), enabled });

  if (isLoading) return <div className="page-shell py-20 text-center">{copy.loading}</div>;
  if (!user) return <Navigate to="/login?next=/admin" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  async function saved(message: string) {
    setNotice(message);
    await Promise.all([
      client.invalidateQueries({ queryKey: ["admin"] }),
      client.invalidateQueries({ queryKey: ["posts"] }),
      client.invalidateQueries({ queryKey: ["site-settings"] }),
      refresh(),
    ]);
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof UsersRound }> = [
    { id: "users", label: copy.users, icon: UsersRound },
    { id: "posts", label: copy.posts, icon: FileText },
    { id: "comments", label: copy.comments, icon: MessageSquareText },
    { id: "content", label: copy.content, icon: Settings },
  ];

  const currentQuery = tab === "users" ? usersQuery : tab === "posts" ? postsQuery : tab === "comments" ? commentsQuery : settingsQuery;

  return (
    <section className="page-shell py-10 sm:py-14">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow flex items-center gap-2"><ShieldCheck size={16} />{copy.title}</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">{copy.title}</h1>
          <p className="mt-3 text-ink-700">{copy.subtitle}</p>
        </div>
        <p className="rounded-full bg-white px-4 py-2 text-sm text-ink-700">{text(copy.signedIn, { name: user.nickname })}</p>
      </div>

      <nav className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => { setTab(id); setNotice(""); }} className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition ${tab === id ? "bg-sage-600 text-white" : "bg-white text-ink-700 hover:bg-sage-50"}`}>
            <Icon size={17} />{label}
          </button>
        ))}
      </nav>

      {notice && <p className="mt-5 rounded-2xl bg-sage-50 px-4 py-3 text-sm font-medium text-sage-700">{notice}</p>}
      {currentQuery.isLoading && <div className="card mt-6 p-10 text-center text-ink-700">{copy.loading}</div>}
      {currentQuery.isError && <div className="card mt-6 p-10 text-center text-red-700">{copy.loadError}</div>}

      {tab === "users" && usersQuery.data && (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {usersQuery.data.users.map((item) => <UserEditor key={item.id} item={item} currentUserId={user.id} copy={copy} onSaved={saved} />)}
          {usersQuery.data.users.length === 0 && <p className="card p-8 text-center text-ink-700">{copy.noData}</p>}
        </div>
      )}

      {tab === "posts" && postsQuery.data && (
        <div className="mt-6 space-y-5">
          {postsQuery.data.posts.map((item) => <PostEditor key={item.id} item={item} copy={copy} onSaved={saved} />)}
          {postsQuery.data.posts.length === 0 && <p className="card p-8 text-center text-ink-700">{copy.noData}</p>}
        </div>
      )}

      {tab === "comments" && commentsQuery.data && (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {commentsQuery.data.comments.map((item) => <CommentEditor key={item.id} item={item} copy={copy} onSaved={saved} />)}
          {commentsQuery.data.comments.length === 0 && <p className="card p-8 text-center text-ink-700">{copy.noData}</p>}
        </div>
      )}

      {tab === "content" && settingsQuery.data && (
        <div className="mt-6"><ContentEditor settings={settingsQuery.data.settings} copy={copy} onSaved={saved} /></div>
      )}
    </section>
  );
}
