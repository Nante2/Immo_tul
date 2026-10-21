import { Heart } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";

const FavoriteButton = ({ propertyId, withLabel = false, className = "" }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(propertyId);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(propertyId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={active}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-white/90 shadow-sm transition-all hover:bg-white hover:scale-105 ${
        withLabel ? "px-4 py-2 text-sm font-medium border" : "w-9 h-9"
      } ${className}`}
    >
      <Heart
        className={`w-5 h-5 transition-colors ${
          active ? "fill-red-500 text-red-500" : "text-foreground"
        }`}
      />
      {withLabel && <span>{active ? "Sauvegardé" : "Sauvegarder"}</span>}
    </button>
  );
};

export default FavoriteButton;
