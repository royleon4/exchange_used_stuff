import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { PublicUser } from "../../../shared/types";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      await api<{ user: PublicUser }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
          nickname: form.get("nickname"),
        }),
      });
      await refresh();
      navigate("/");
    } catch (value) {
      setError(value instanceof ApiError ? value.message : "註冊失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-shell py-12 sm:py-20">
      <div className="card mx-auto max-w-lg p-6 sm:p-9">
        <p className="eyebrow">Join the Wall</p>
        <h1 className="mt-3 font-display text-4xl font-semibold">建立你的婚禮暱稱</h1>
        <p className="mt-3 text-sm leading-6 text-ink-700">其他賓客只會看到你的暱稱，不會看到登入帳號。</p>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="block text-sm font-medium">暱稱<input className="field mt-2" name="nickname" minLength={2} maxLength={20} required /><span className="mt-1 block text-xs text-ink-700">將顯示在貼文與留言上</span></label>
          <label className="block text-sm font-medium">帳號<input className="field mt-2" name="username" minLength={4} maxLength={30} autoComplete="username" required /><span className="mt-1 block text-xs text-ink-700">英文字母、數字、底線或句點</span></label>
          <label className="block text-sm font-medium">密碼<input className="field mt-2" type="password" name="password" minLength={8} maxLength={72} autoComplete="new-password" required /></label>
          <label className="block text-sm font-medium">婚禮邀請碼（如有）<input className="field mt-2" name="inviteCode" /></label>
          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button className="btn-primary w-full" disabled={submitting}>{submitting ? "建立中…" : "加入需求牆"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-700">已經有帳號？ <Link to="/login" className="font-semibold text-sage-700">前往登入</Link></p>
      </div>
    </section>
  );
}
