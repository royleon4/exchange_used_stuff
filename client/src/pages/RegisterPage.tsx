import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { PublicUser } from "../../../shared/types";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useLanguage } from "../lib/i18n";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { refresh } = useAuth();
  const { t } = useLanguage();
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
      setError(value instanceof ApiError ? value.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-shell py-12 sm:py-20">
      <div className="card mx-auto max-w-lg p-6 sm:p-9">
        <p className="eyebrow">{t("joinEyebrow")}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold">{t("joinTitle")}</h1>
        <p className="mt-3 text-sm leading-6 text-ink-700">{t("joinDescription")}</p>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="block text-sm font-medium">
            {t("nickname")}
            <input className="field mt-2" name="nickname" minLength={2} maxLength={20} required />
            <span className="mt-1 block text-xs text-ink-700">{t("nicknameHelp")}</span>
          </label>
          <label className="block text-sm font-medium">
            {t("username")}
            <input className="field mt-2" name="username" minLength={4} maxLength={30} autoComplete="username" required />
            <span className="mt-1 block text-xs text-ink-700">{t("usernameHelp")}</span>
          </label>
          <label className="block text-sm font-medium">
            {t("password")}
            <input className="field mt-2" type="password" name="password" minLength={8} maxLength={72} autoComplete="new-password" required />
          </label>
          {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button className="btn-primary w-full" disabled={submitting}>
            {submitting ? t("creatingAccount") : t("joinWall")}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-ink-700">
          {t("alreadyAccount")} <Link to="/login" className="font-semibold text-sage-700">{t("goLogin")}</Link>
        </p>
      </div>
    </section>
  );
}
