import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import { getImageUrl, PLACEHOLDER_IMAGE } from "@/services/api";

const handleImageError = (e) => {
  if (!e.currentTarget.src.endsWith(PLACEHOLDER_IMAGE)) e.currentTarget.src = PLACEHOLDER_IMAGE;
};

const NavArrow = ({ direction, onClick, className = "" }) => {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Photo précédente" : "Photo suivante"}
      className={`absolute top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md transition hover:bg-white hover:scale-105 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
        direction === "prev" ? "left-3" : "right-3"
      } ${className}`}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
};

// Galerie photo : image principale avec flèches, vignettes et visionneuse plein écran
const ImageGallery = ({ images, title }) => {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef(null);
  const count = images.length;
  const list = count > 0 ? images : [null];

  const go = useCallback((delta) => setActive((i) => (i + delta + list.length) % list.length), [list.length]);

  // Clavier dans la visionneuse : flèches pour naviguer, Échap pour fermer
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, go]);

  // Balayage horizontal sur mobile
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) go(dx > 0 ? -1 : 1);
    touchStartX.current = null;
  };

  return (
    <div className="mb-10">
      <div
        className="group relative rounded-2xl overflow-hidden mb-3 bg-secondary"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="block w-full cursor-zoom-in"
          aria-label="Agrandir la photo"
        >
          <img
            src={getImageUrl(list[active])}
            alt={count > 1 ? `${title} — photo ${active + 1} sur ${count}` : title}
            onError={handleImageError}
            className="w-full h-[280px] sm:h-[380px] md:h-[500px] object-cover"
          />
        </button>
        {count > 1 && (
          <>
            <NavArrow direction="prev" onClick={() => go(-1)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100" />
            <NavArrow direction="next" onClick={() => go(1)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100" />
          </>
        )}
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
          <Expand className="h-3.5 w-3.5" />
          {count > 1 ? `${active + 1} / ${count}` : "Agrandir"}
        </div>
      </div>

      {count > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Afficher la photo ${index + 1}`}
              aria-current={active === index}
              className={`shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                active === index ? "border-primary shadow-md" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={getImageUrl(image)}
                alt=""
                loading="lazy"
                onError={handleImageError}
                className="w-24 h-18 md:w-32 md:h-24 object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photos de ${title}`}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 animate-in fade-in duration-200"
          onClick={() => setLightbox(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={getImageUrl(list[active])}
            alt={title}
            onError={handleImageError}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[92vw] object-contain select-none"
          />
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Fermer"
            autoFocus
            className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          {count > 1 && (
            <>
              <NavArrow direction="prev" onClick={(e) => { e.stopPropagation(); go(-1); }} />
              <NavArrow direction="next" onClick={(e) => { e.stopPropagation(); go(1); }} />
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white">
                {active + 1} / {count}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
