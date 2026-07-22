import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="page-shell py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-display text-5xl font-semibold">這裡沒有物品</h1>
      <p className="mt-4 text-ink-700">你造訪的頁面可能已被移除。</p>
      <Link to="/" className="btn-primary mt-7">回到物品牆</Link>
    </section>
  );
}
