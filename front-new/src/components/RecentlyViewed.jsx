import { useState, useEffect } from "react";
import { History, X } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import { getRecentlyViewed, clearRecentlyViewed, RECENTLY_VIEWED_EVENT } from "@/lib/recentlyViewed";

// Rangée défilante des derniers biens consultés (masquée s'il n'y en a pas)
const RecentlyViewed = ({ excludeId, title = "Vus récemment" }) => {
  const [items, setItems] = useState(getRecentlyViewed);

  useEffect(() => {
    const refresh = () => setItems(getRecentlyViewed());
    window.addEventListener(RECENTLY_VIEWED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(RECENTLY_VIEWED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const visible = items.filter((p) => String(p.id) !== String(excludeId));
  if (visible.length === 0) return null;

  return (
    <section className="py-14" aria-labelledby="recently-viewed-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 id="recently-viewed-title" className="flex items-center gap-2 text-2xl font-bold">
            <History className="w-6 h-6 text-primary" />
            {title}
          </h2>
          <button
            type="button"
            onClick={clearRecentlyViewed}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
            Effacer l'historique
          </button>
        </div>
        <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:thin]">
          {visible.map((property) => (
            <div key={property.id} className="snap-start shrink-0 w-[280px] sm:w-[320px]">
              <PropertyCard property={property} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
