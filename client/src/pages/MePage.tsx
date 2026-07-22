import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";

export default function MePage() {
  const { user, isLoading } = useAuth();
  const posts = useQuery({
    queryKey: ["me", "posts"],
    queryFn: () => api<{ posts: Array<Record<string, unknown>> }>("/api/me/posts"),
    enabled: !!user,
  });
  const wants = useQuery({
    queryKey: ["me", "wants"],
    queryFn: () => api<{ posts: Array<Record<string, unknown>> }>("/api/me/wants"),
    enabled: !!user,
  });

  if (isLoading) return <div className="page-shell py-20 text-center">讀取中…</div>;
  if (!user) return <Navigate to="/login?next=/me" replace />;

  return (
    <section className="page-shell py-12">
      <p className="eyebrow">My Corner</p>
      <h1 className="mt-3 font-display text-5xl font-semibold">{user.nickname} 的收藏角落</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">我的貼文</h2>
          <p className="mt-3 font-display text-4xl text-sage-700">{posts.data?.posts.length ?? 0}</p>
          <p className="mt-1 text-sm text-ink-700">已發布的物品</p>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold">我想要的物品</h2>
          <p className="mt-3 font-display text-4xl text-sage-700">{wants.data?.posts.length ?? 0}</p>
          <p className="mt-1 text-sm text-ink-700">目前表達過興趣</p>
        </div>
      </div>
      <div className="card mt-6 p-8 text-ink-700">
        完整清單與暱稱編輯介面會在下一階段補上；資料 API 已就緒。
      </div>
    </section>
  );
}
