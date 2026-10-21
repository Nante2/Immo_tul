import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2, Scale, X, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/context/FavoritesContext";
import { getPropertyById, getImageUrl, PLACEHOLDER_IMAGE } from "@/services/api";
import { usePageTitle } from "@/hooks/usePageTitle";

const MAX_COMPARE = 3;

const STATUS_LABELS = { available: "Disponible", reserved: "Réservé", sold: "Vendu" };

// Lignes du tableau comparatif : libellé + valeur affichée pour chaque bien
const COMPARE_ROWS = [
  ["Prix", (p) => <span className="font-bold text-primary">{p.prix}</span>],
  ["Transaction", (p) => (p.actionType === "rent" ? "Location" : "Vente")],
  ["Type", (p) => p.type],
  ["Localisation", (p) => p.location],
  ["Surface", (p) => p.area || "—"],
  ["Chambres", (p) => p.beds ?? "—"],
  ["Salles de bain", (p) => p.baths ?? "—"],
  ["Statut", (p) => STATUS_LABELS[p.status] || p.status],
];

const handleImageError = (e) => {
  if (!e.currentTarget.src.endsWith(PLACEHOLDER_IMAGE)) e.currentTarget.src = PLACEHOLDER_IMAGE;
};

const CompareTable = ({ items, onClose }) => (
  <section className="mb-12 rounded-2xl bg-white shadow-sm border overflow-hidden" aria-labelledby="compare-title">
    <div className="flex items-center justify-between gap-4 p-5 border-b">
      <h2 id="compare-title" className="flex items-center gap-2 text-xl font-bold">
        <Scale className="w-5 h-5 text-primary" />
        Comparaison
      </h2>
      <button type="button" onClick={onClose} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" /> Fermer
      </button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr>
            <th className="w-36 p-4" />
            {items.map((p) => (
              <th key={p.id} scope="col" className="p-4 text-left align-top font-normal">
                <Link to={`/property/${p.id}`} className="group block">
                  <img
                    src={getImageUrl(p.image)}
                    alt=""
                    onError={handleImageError}
                    className="mb-3 h-36 sm:h-44 w-full rounded-lg object-cover"
                  />
                  <span className="font-semibold text-base text-foreground group-hover:text-primary">{p.titre}</span>
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_ROWS.map(([label, render]) => (
            <tr key={label} className="border-t">
              <th scope="row" className="p-4 text-left font-medium text-muted-foreground">{label}</th>
              {items.map((p) => (
                <td key={p.id} className="p-4">{render(p)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

function Favoris() {
  usePageTitle("Mes favoris");
  const { favorites, removeFavorite, clearFavorites } = useFavorites();
  const [compareIds, setCompareIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const toggleCompare = (id) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < MAX_COMPARE ? [...prev, id] : prev
    );
  };
  // Cache des biens déjà chargés, indexé par id
  const [loaded, setLoaded] = useState({});

  useEffect(() => {
    const missing = favorites.filter((id) => !loaded[id]);
    if (missing.length === 0) return;

    let cancelled = false;
    Promise.allSettled(missing.map((id) => getPropertyById(id))).then((results) => {
      if (cancelled) return;
      const fetched = {};
      results.forEach((result, i) => {
        if (result.status === "fulfilled" && result.value) {
          fetched[missing[i]] = result.value;
        } else {
          // Bien supprimé ou introuvable : on le retire des favoris
          removeFavorite(missing[i]);
        }
      });
      setLoaded((prev) => ({ ...prev, ...fetched }));
    });

    return () => {
      cancelled = true;
    };
  }, [favorites, loaded, removeFavorite]);

  const properties = favorites.map((id) => loaded[id]).filter(Boolean);
  const loading = properties.length < favorites.length;
  // Ignore les biens retirés des favoris entre-temps
  const compared = properties.filter((p) => compareIds.includes(String(p.id)));

  return (
    <>
      <Navbar />
      <div className="pt-20 bg-secondary/30 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Mes favoris</h1>
              <p className="text-muted-foreground">
                Les biens que vous avez sauvegardés sur cet appareil
              </p>
            </div>
            {favorites.length > 0 && (
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm py-1 px-3">
                  {favorites.length} bien(s)
                </Badge>
                {confirmClear ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Tout supprimer ?</span>
                    <Button variant="destructive" onClick={() => { clearFavorites(); setConfirmClear(false); setCompareIds([]); }}>
                      Oui
                    </Button>
                    <Button variant="outline" onClick={() => setConfirmClear(false)}>Non</Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setConfirmClear(true)} className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Tout effacer
                  </Button>
                )}
              </div>
            )}
          </div>

          {favorites.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Aucun favori pour le moment</h3>
              <p className="text-muted-foreground mb-6">
                Cliquez sur le cœur d'un bien pour le retrouver ici
              </p>
              <div className="flex justify-center gap-3">
                <Link to="/Avendre">
                  <Button variant="accent">Biens à vendre</Button>
                </Link>
                <Link to="/Alouer">
                  <Button variant="outline">Biens à louer</Button>
                </Link>
              </div>
            </div>
          ) : properties.length === 0 && loading ? (
            <div className="text-center py-20 text-muted-foreground">Chargement...</div>
          ) : (
            <>
              {showCompare && compared.length >= 2 && (
                <CompareTable items={compared} onClose={() => setShowCompare(false)} />
              )}
              {properties.length >= 2 && (
                <p className="mb-4 text-sm text-muted-foreground">
                  Cochez jusqu'à {MAX_COMPARE} biens pour les comparer côte à côte.
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.map((property) => {
                  const id = String(property.id);
                  const selected = compareIds.includes(id);
                  const disabled = !selected && compareIds.length >= MAX_COMPARE;
                  return (
                    <div key={property.id} className="relative">
                      <PropertyCard property={property} />
                      {properties.length >= 2 && (
                        <label
                          className={`absolute top-14 right-3 z-10 flex items-center gap-2 rounded-full border bg-white/95 px-3 py-1.5 text-xs font-medium shadow-sm transition-colors ${
                            selected ? "border-primary text-primary" : "text-foreground"
                          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary"}`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={selected}
                            disabled={disabled}
                            onChange={() => toggleCompare(id)}
                          />
                          <span className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
                            {selected && <Check className="h-3 w-3 text-white" />}
                          </span>
                          Comparer
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Barre de comparaison */}
              {compared.length > 0 && !(showCompare && compared.length >= 2) && (
                <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 flex items-center gap-3 rounded-full bg-[#0a2540] py-2 pl-5 pr-2 text-white shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-200">
                  <span className="text-sm whitespace-nowrap">{compared.length} / {MAX_COMPARE} sélectionné(s)</span>
                  <Button
                    variant="accent"
                    size="sm"
                    disabled={compared.length < 2}
                    onClick={() => { setShowCompare(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="rounded-full"
                  >
                    {compared.length < 2 ? "Choisissez-en un autre" : "Comparer"}
                  </Button>
                  <button type="button" onClick={() => setCompareIds([])} aria-label="Annuler la sélection" className="p-1.5 text-white/70 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Favoris;
