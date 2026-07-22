import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="page-shell py-20 text-center">讀取中…</div>;
  if (!user) return <Navigate to="/login?next=/admin" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  const tabs = ["貼文管理", "留言管理", "會員管理", "圖片與清理", "站台設定"];
  return (
    <section className="page-shell py-10">
      <div className="card overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 px-6 py-4">
          <div>
            <p className="font-semibold text-sage-700">管理後台</p>
            <p className="text-sm text-ink-700">登入者：{user.nickname}</p>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-cream-200 px-4 pt-3">
          {tabs.map((tab, index) => (
            <button
              type="button"
              key={tab}
              className={`whitespace-nowrap rounded-t-xl px-4 py-3 text-sm font-medium ${
                index === 0 ? "bg-sage-600 text-white" : "text-ink-700 hover:bg-sage-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
        <main className="p-6 sm:p-8">
          <h1 className="font-display text-4xl font-semibold">貼文管理</h1>
          <p className="mt-4 leading-7 text-ink-700">
            管理 API 與分頁骨架已建立。下一階段會接上列表、搜尋、隱藏／恢復與圖片清理操作。
          </p>
        </main>
      </div>
    </section>
  );
}
