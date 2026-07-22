import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { useLanguage } from "../lib/i18n";

type CarouselImage = {
  id: number;
  url: string;
  alt: string;
};

type ImageCarouselProps = {
  images: CarouselImage[];
  className?: string;
  imageClassName?: string;
  overlay?: ReactNode;
  showCounter?: boolean;
};

export default function ImageCarousel({
  images,
  className = "aspect-[4/3]",
  imageClassName = "h-full w-full object-cover",
  overlay,
  showCounter = true,
}: ImageCarouselProps) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= images.length) setIndex(0);
  }, [images.length, index]);

  const hasMultiple = images.length > 1;
  const current = images[index];

  function move(event: MouseEvent<HTMLButtonElement>, direction: -1 | 1) {
    event.preventDefault();
    event.stopPropagation();
    setIndex((value) => (value + direction + images.length) % images.length);
  }

  return (
    <div className={`relative overflow-hidden bg-sage-50 ${className}`}>
      {current ? (
        <img src={current.url} alt={current.alt} className={imageClassName} loading="lazy" />
      ) : (
        <div className="grid h-full min-h-56 place-items-center text-sage-300">
          <ImageIcon size={44} aria-hidden="true" />
        </div>
      )}

      {overlay}

      {hasMultiple && (
        <>
          <button
            type="button"
            className="absolute left-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-sage-700 shadow-md backdrop-blur transition hover:bg-white"
            onClick={(event) => move(event, -1)}
            aria-label={t("previousPhoto")}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-sage-700 shadow-md backdrop-blur transition hover:bg-white"
            onClick={(event) => move(event, 1)}
            aria-label={t("nextPhoto")}
          >
            <ChevronRight size={22} />
          </button>

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 rounded-full bg-ink-900/55 px-2.5 py-2 backdrop-blur">
            {images.map((image, dotIndex) => (
              <button
                key={image.id}
                type="button"
                className={`size-1.5 rounded-full transition ${dotIndex === index ? "bg-white" : "bg-white/45"}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIndex(dotIndex);
                }}
                aria-label={t("photoPosition", { current: dotIndex + 1, total: images.length })}
                aria-current={dotIndex === index ? "true" : undefined}
              />
            ))}
          </div>
        </>
      )}

      {showCounter && hasMultiple && (
        <span className="absolute bottom-3 right-3 rounded-full bg-ink-900/70 px-2.5 py-1 text-xs text-white backdrop-blur">
          {index + 1}/{images.length}
        </span>
      )}
    </div>
  );
}
