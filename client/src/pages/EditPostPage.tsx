import { Link } from "react-router-dom";
import { useLanguage } from "../lib/i18n";

export default function EditPostPage() {
  const { t } = useLanguage();

  return (
    <section className="page-shell py-16">
      <div className="card mx-auto max-w-2xl p-8">
        <h1 className="font-display text-4xl font-semibold">{t("editPostTitle")}</h1>
        <p className="mt-4 text-ink-700">{t("editPostPending")}</p>
        <Link to="/me" className="btn-primary mt-6">{t("backToCollection")}</Link>
      </div>
    </section>
  );
}
