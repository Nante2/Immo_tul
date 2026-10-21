import { Link } from "react-router-dom";
import { MapPin, BedDouble, Bath, Maximize } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FavoriteButton from "@/components/FavoriteButton";
import { getImageUrl, PLACEHOLDER_IMAGE } from "@/services/api";

const statusBadge = {
  available: { label: "Disponible", variant: "success" },
  reserved: { label: "Réservé", variant: "warning" },
  sold: { label: "Vendu", variant: "destructive" },
};

// Remplace une image introuvable par l'illustration par défaut (une seule fois)
const handleImageError = (e) => {
  if (!e.currentTarget.src.endsWith(PLACEHOLDER_IMAGE)) {
    e.currentTarget.src = PLACEHOLDER_IMAGE;
  }
};

const PropertyCard = ({ property, layout = "grid" }) => {
  const status = statusBadge[property.status] || statusBadge.available;
  const isList = layout === "list";

  return (
      <Card
        className={`group relative h-full flex flex-col overflow-hidden border-0 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 focus-within:ring-3 focus-within:ring-ring/50 ${
          isList ? "sm:flex-row" : ""
        } ${property.status === "sold" ? "opacity-80" : ""}`}
      >
        {/* Image */}
        <div
          className={`relative overflow-hidden bg-secondary ${
            isList ? "aspect-[4/3] sm:aspect-auto sm:w-72 sm:shrink-0 sm:min-h-52" : "aspect-[4/3]"
          }`}
        >
          <img
            src={getImageUrl(property.image || property.Image)}
            alt={property.titre}
            loading="lazy"
            decoding="async"
            onError={handleImageError}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant={property.actionType === "rent" ? "accent" : "default"}>
              {property.actionType === "rent" ? "À louer" : "À vendre"}
            </Badge>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <FavoriteButton propertyId={property.id} className="absolute top-3 right-3 z-10" />
        </div>

        <CardContent className={`p-5 flex flex-col ${isList ? "flex-1 sm:p-6" : ""}`}>
          {/* Price */}
          <div className="text-xl font-bold text-primary mb-2">
            {property.prix}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {/* Le lien couvre toute la carte (pseudo-élément), le bouton favori reste cliquable au-dessus */}
            <Link
              to={`/property/${property.id}`}
              className="outline-none after:absolute after:inset-0 after:content-['']"
            >
              {property.titre}
            </Link>
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="text-sm truncate">{property.location}</span>
          </div>

          {isList && property.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{property.description}</p>
          )}

          {/* Specs */}
          <div className="mt-auto flex items-center gap-4 pt-4 border-t text-sm text-muted-foreground">
            {property.beds && (
              <div className="flex items-center gap-1.5" title="Chambres">
                <BedDouble className="w-4 h-4" />
                <span>{property.beds}</span>
                <span className="sr-only">chambre(s)</span>
              </div>
            )}
            {property.baths && (
              <div className="flex items-center gap-1.5" title="Salles de bain">
                <Bath className="w-4 h-4" />
                <span>{property.baths}</span>
                <span className="sr-only">salle(s) de bain</span>
              </div>
            )}
            {property.area && (
              <div className="flex items-center gap-1.5" title="Surface">
                <Maximize className="w-4 h-4" />
                <span>{property.area}</span>
              </div>
            )}
            <div className="ml-auto">
              <Badge variant="secondary">{property.type}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
  );
};

export default PropertyCard;
