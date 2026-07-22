import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { PublicUser } from "../../../shared/types";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      await api<{ user: PublicUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      await refresh();
      const next = new URLSearchParams(location.search).get("next");
      navigate(next?.startsWith("/") ? next : "/");
    } catch (value) {
      setError(value instanceof ApiError ? value.message : "登入失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-shell py-12 sm:py-20">
      <div className="card mx-auto max-w-md p-6 sm:p-9">
        <p className="eyebrow">Welcome Back</p>
        <h1 className="mt-3 font-display text-4xl font-semibold">登入需求牆</h1>
        <p className="mt-3 text-sm leading-6 text-ink-700">登入後可以發布物品、按「我想要」與留言。</p>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="block text-sm font-medium">帳號<input className="field mt-2" name="username" autoComplete="username" required /></label>
          <label className="block text-sm font-medium">密碼<input className="field mt-2" type="password" name="password" autoComplete="current-password" required /></label>
          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button className="btn-primary w-full" disabled={submitting}>{submitting ? "登入中…" : "登入"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-700">還沒有帳號？ <Link to="/register" className="font-semibold text-sage-700">立即加入</Link></p>
      </div>
    </section>
  );
}
