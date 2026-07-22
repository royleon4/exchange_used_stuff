import { Link } from "react-router-dom";

export default function EditPostPage() {
  return (
    <section className="page-shell py-16">
      <div className="card mx-auto max-w-2xl p-8">
        <h1 className="font-display text-4xl font-semibold">編輯貼文</h1>
        <p className="mt-4 text-ink-700">
          後端更新與權限檢查已完成；圖片重排與完整編輯表單會在下一階段接上。
        </p>
        <Link to="/me" className="btn-primary mt-6">回到我的收藏</Link>
      </div>
    </section>
  );
}
