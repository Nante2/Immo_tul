import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, LayoutGrid, List, Home, X } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPublicProperties, getPropertyFilters } from "@/services/api";

const PAGE_SIZE = 12;
const FILTER_KEYS = ["type", "priceMin", "priceMax", "location", "beds", "area"];
const TYPES = ["Maison", "Villa", "Appartement", "Terrain"];
const VIEW_MODE_KEY = "listViewMode";

const formatNumber = (v) => new Intl.NumberFormat("fr-FR").format(Number(v)).replace(/\u202f|\u00a0/g, " ");

// Libellé lisible de chaque filtre actif (puces au-dessus des résultats)
const FILTER_LABELS = {
  type: (v) => v,
  priceMin: (v) => `Dès ${formatNumber(v)} Ar`,
  priceMax: (v) => `Jusqu'à ${formatNumber(v)} Ar`,
  location: (v) => v,
  beds: (v) => `${v}+ chambre${Number(v) > 1 ? "s" : ""}`,
  area: (v) => `${formatNumber(v)} m² min.`,
};

const readViewMode = () => {
  try {
    return localStorage.getItem(VIEW_MODE_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
};

// Champ numérique qui n'envoie sa valeur qu'après une courte pause de frappe
const DebouncedNumberInput = ({ value, onCommit, ...props }) => {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // Resynchronise si la valeur change de l'extérieur (ex: bouton « Effacer »)
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onCommit(draft), 400);
    return () => clearTimeout(timer);
  }, [draft, value, onCommit]);

  return (
    <input
      type="number"
      min="0"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      className="w-full text-sm border rounded-lg px-3 py-2 bg-background"
      {...props}
    />
  );
};

const PropertyList = ({ actionType, title, description }) => {
  // Les filtres vivent dans l'URL : partageables et conservés au retour arrière
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort") || "default";
  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, searchParams.get(k) || ""]));

  const [viewMode, setViewModeState] = useState(readViewMode);
  const setViewMode = (mode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // Préférence non mémorisée si le stockage est indisponible
    }
  };
  const [showFilters, setShowFilters] = useState(() => FILTER_KEYS.some((k) => searchParams.get(k)));
  const [locations, setLocations] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  // Résultats associés à la requête qui les a produits, pour savoir s'ils sont à jour
  const [results, setResults] = useState({ key: null, properties: [], pagination: null });

  const queryKey = `${actionType || ""}|${searchParams.toString()}`;
  const loading = results.key !== queryKey;

  const buildQuery = (page) => ({
    actionType,
    search,
    ...filters,
    sort: sortBy === "default" ? "" : sortBy,
    page,
    limit: PAGE_SIZE,
  });

  useEffect(() => {
    getPropertyFilters()
      .then((data) => setLocations(data.locations || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getPublicProperties(buildQuery(1))
      .then((data) => {
        if (cancelled) return;
        setError(null);
        setResults({ key: queryKey, properties: data.properties || [], pagination: data.pagination });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setError("Impossible de charger les biens. Veuillez réessayer.");
        setResults({ key: queryKey, properties: [], pagination: null });
      });
    return () => {
      cancelled = true;
    };
    // buildQuery ne dépend que de ce qui est encodé dans queryKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const loadMore = async () => {
    const nextPage = (results.pagination?.page || 1) + 1;
    setLoadingMore(true);
    try {
      const data = await getPublicProperties(buildQuery(nextPage));
      setResults((prev) => ({
        ...prev,
        properties: [...prev.properties, ...(data.properties || [])],
        pagination: data.pagination,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const updateParam = (key, value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === "" || value == null || (key === "sort" && value === "default")) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true }
    );
  };

  const clearFilters = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        FILTER_KEYS.forEach((k) => next.delete(k));
        return next;
      },
      { replace: true }
    );
  };

  const { properties, pagination } = results;
  const activeFilters = FILTER_KEYS.filter((k) => filters[k]);
  const total = pagination?.total ?? properties.length;
  const hasMore = pagination && pagination.page < pagination.pages;

  return (
    <div className="pt-20">
      {/* Header */}
      <div className="bg-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{title}</h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">{description}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Toggle + Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres
              {activeFilters.length > 0 && (
                <span className={`ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold ${
                  showFilters ? "bg-white text-primary" : "bg-primary text-white"
                }`}>
                  {activeFilters.length}
                </span>
              )}
            </Button>
            <Badge variant="secondary" className="text-sm py-1 px-3">
              {loading ? "…" : `${total} bien(s)`}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Trier :</span>
              <select
                value={sortBy}
                onChange={(e) => updateParam("sort", e.target.value)}
                className="text-sm border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-ring outline-none"
              >
                <option value="default">Par défaut</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="area-desc">Surface décroissante</option>
                <option value="newest">Plus récent</option>
              </select>
            </div>

            <div className="hidden sm:flex border rounded-lg overflow-hidden">
              <button
                aria-label="Affichage en grille"
                aria-pressed={viewMode === "grid"}
                className={`p-2 transition-colors ${viewMode === "grid" ? "bg-primary text-white" : "hover:bg-secondary"}`}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                aria-label="Affichage en liste"
                aria-pressed={viewMode === "list"}
                className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-white" : "hover:bg-secondary"}`}
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="bg-secondary/50 rounded-xl p-6 mb-8 border">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type de bien</label>
                <select
                  value={filters.type}
                  onChange={(e) => updateParam("type", e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background"
                >
                  <option value="">Tous</option>
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Prix min {actionType === "rent" ? "(Ar/mois)" : "(Ar)"}
                </label>
                <DebouncedNumberInput
                  placeholder="Min"
                  value={filters.priceMin}
                  onCommit={(v) => updateParam("priceMin", v)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Prix max</label>
                <DebouncedNumberInput
                  placeholder="Max"
                  value={filters.priceMax}
                  onCommit={(v) => updateParam("priceMax", v)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Localisation</label>
                <select
                  value={filters.location}
                  onChange={(e) => updateParam("location", e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background"
                >
                  <option value="">Toutes</option>
                  {locations.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Chambres min.</label>
                <select
                  value={filters.beds}
                  onChange={(e) => updateParam("beds", e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-background"
                >
                  <option value="">Indifférent</option>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Surface min. (m²)</label>
                <DebouncedNumberInput
                  placeholder="Min"
                  value={filters.area}
                  onCommit={(v) => updateParam("area", v)}
                />
              </div>
              <div className="flex items-end">
                <Button variant="ghost" onClick={clearFilters} className="w-full">
                  Effacer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filtres actifs, retirables un par un */}
        {(activeFilters.length > 0 || search) && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
                « {search} »
                <button type="button" onClick={() => updateParam("search", "")} aria-label="Retirer la recherche" className="ml-0.5 rounded-full p-0.5 hover:bg-black/10">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {activeFilters.map((key) => (
              <span key={key} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                {FILTER_LABELS[key](filters[key])}
                <button type="button" onClick={() => updateParam(key, "")} aria-label={`Retirer le filtre ${FILTER_LABELS[key](filters[key])}`} className="ml-0.5 rounded-full p-0.5 hover:bg-primary/15">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {activeFilters.length > 1 && (
              <button type="button" onClick={clearFilters} className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground">
                Tout effacer
              </button>
            )}
          </div>
        )}

        {/* Properties Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-secondary animate-pulse aspect-[4/5]" />
            ))}
          </div>
        ) : properties.length > 0 ? (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  : "space-y-4"
              }
            >
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} layout={viewMode} />
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-10">
                <Button variant="outline" size="lg" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Chargement..." : `Voir plus (${total - properties.length} restants)`}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Home className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{error ? "Erreur de chargement" : "Aucun bien trouvé"}</h3>
            <p className="text-muted-foreground mb-6">
              {error || "Essayez de modifier vos critères de recherche"}
            </p>
            {!error && (
              <Button variant="outline" onClick={clearFilters}>
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyList;
