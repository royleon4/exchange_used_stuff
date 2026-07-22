import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Heart, PackageOpen, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { PostCard as PostCardType } from "../../../shared/types";
import PostCard from "../components/PostCard";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function HomePage() {
  const [sort, setSort] = useState("latest");
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["posts", sort],
    queryFn: () => api<{ posts: PostCardType[] }>(`/api/posts?sort=${sort}&pageSize=24`),
  });

  return (
    <>
      <section className="page-shell py-12 sm:py-20">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/75 px-6 py-12 shadow-soft backdrop-blur sm:px-12 sm:py-20">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-sage-100/70 blur-2xl" />
          <div className="absolute -bottom-24 left-1/3 size-72 rounded-full bg-cream-200/80 blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="eyebrow">Excel & Min Wedding</p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.98] text-ink-900 sm:text-7xl">
              讓好物在婚禮這天，<span className="text-sage-600">遇見下一個喜歡它的人。</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-ink-700 sm:text-lg">
              先把你可能帶來的二手物品放上來，看看有沒有賓客感興趣。有人按「我想要」，你就能更安心地決定要不要把它帶到現場。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={user ? "/posts/new" : "/register"} className="btn-primary">
                {user ? "發布物品" : "加入需求牆"}<ArrowRight size={18} />
              </Link>
              <a href="#items" className="btn-secondary">先看看大家帶什麼</a>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell grid gap-4 sm:grid-cols-3">
        <div className="card p-6">
          <span className="grid size-11 place-items-center rounded-2xl bg-sage-50 text-sage-600"><PackageOpen size={20} /></span>
          <h2 className="mt-4 font-semibold text-ink-900">分享好物</h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">放上照片與簡短介紹，不必先把物品搬來。</p>
        </div>
        <div className="card p-6">
          <span className="grid size-11 place-items-center rounded-2xl bg-sage-50 text-sage-600"><Heart size={20} /></span>
          <h2 className="mt-4 font-semibold text-ink-900">看看需求</h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">賓客用「我想要」告訴你，他們對物品有興趣。</p>
        </div>
        <div className="card p-6">
          <span className="grid size-11 place-items-center rounded-2xl bg-sage-50 text-sage-600"><Sparkles size={20} /></span>
          <h2 className="mt-4 font-semibold text-ink-900">婚禮見面</h2>
          <p className="mt-2 text-sm leading-6 text-ink-700">確定有人喜歡，再決定是否帶到現場交換。</p>
        </div>
      </section>

      <section id="items" className="page-shell scroll-mt-24 py-16">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Second Life Items</p>
            <h2 className="mt-2 font-display text-4xl font-semibold text-ink-900">大家可能會帶來的物品</h2>
          </div>
          <label className="flex items-center gap-3 text-sm text-ink-700">
            排序
            <select className="field !w-auto !rounded-full !py-2" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="latest">最新發布</option>
              <option value="oldest">最早發布</option>
              <option value="wanted">最多人想要</option>
            </select>
          </label>
        </div>

        {query.isLoading && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-96 animate-pulse rounded-3xl bg-white/70" />)}
          </div>
        )}

        {query.isError && (
          <div className="card mt-8 p-8 text-center text-ink-700">目前無法讀取物品，請稍後重新整理。</div>
        )}

        {query.data?.posts.length === 0 && (
          <div className="card mt-8 px-6 py-16 text-center">
            <PackageOpen className="mx-auto text-sage-300" size={48} />
            <h3 className="mt-5 text-xl font-semibold">第一件好物正在等你</h3>
            <p className="mt-2 text-ink-700">目前還沒有貼文，成為第一位分享的人吧。</p>
            <Link to={user ? "/posts/new" : "/register"} className="btn-primary mt-6">發布第一件物品</Link>
          </div>
        )}

        {!!query.data?.posts.length && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {query.data.posts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </section>
    </>
  );
}
