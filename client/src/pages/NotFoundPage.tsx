import { Link } from "react-router-dom";
import { useLanguage } from "../lib/i18n";

export default function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <section className="page-shell py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 font-display text-5xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="mt-4 text-ink-700">{t("notFoundDescription")}</p>
      <Link to="/" className="btn-primary mt-7">{t("backHome")}</Link>
    </section>
  );
}
