import { Languages } from "lucide-react";
import { useLanguage } from "../lib/i18n";

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className="inline-flex items-center overflow-hidden rounded-full border border-sage-100 bg-white shadow-sm"
      aria-label={t("language")}
    >
      {!compact && <Languages className="ml-3 text-sage-600" size={15} aria-hidden="true" />}
      <button
        type="button"
        className={`min-h-9 px-3 text-xs font-semibold transition ${
          language === "zh" ? "bg-sage-600 text-white" : "text-ink-700 hover:bg-sage-50"
        }`}
        onClick={() => setLanguage("zh")}
        aria-pressed={language === "zh"}
      >
        中
      </button>
      <button
        type="button"
        className={`min-h-9 px-3 text-xs font-semibold transition ${
          language === "en" ? "bg-sage-600 text-white" : "text-ink-700 hover:bg-sage-50"
        }`}
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
      >
        EN
      </button>
    </div>
  );
}
