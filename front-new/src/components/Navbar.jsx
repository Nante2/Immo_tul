import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/context/FavoritesContext";

const menuItems = [
  { title: "Accueil", url: "/" },
  { title: "À vendre", url: "/Avendre" },
  { title: "À louer", url: "/Alouer" },
  { title: "Prestations", url: "/Prestation" },
  { title: "À propos", url: "/Apropos" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { count: favoritesCount } = useFavorites();
  const hasDarkHero = location.pathname === '/' || location.pathname === '/Apropos';
  const isSolid = isScrolled || isOpen || !hasDarkHero;

  // Ferme le menu mobile à chaque changement de page
  const [lastPath, setLastPath] = useState(location.pathname);
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Bloque le défilement de la page derrière le menu mobile ouvert
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const desktopLinkClass = ({ isActive }) =>
    `relative px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      isSolid
        ? isActive ? "text-primary bg-secondary" : "text-foreground hover:text-primary hover:bg-secondary"
        : isActive ? "text-white bg-white/15" : "text-white/90 hover:text-white hover:bg-white/10"
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
      isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"
    }`;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isSolid ? "bg-white/95 backdrop-blur-sm shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center" aria-label="ImmoTuléar, accueil">
            <span
              className={`text-2xl font-bold transition-colors ${
                isSolid ? "text-primary" : "text-white"
              }`}
            >
              Immo<span className="text-accent">Tuléar</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1">
            {menuItems.map((item) => (
              <NavLink key={item.url} to={item.url} end={item.url === "/"} className={desktopLinkClass}>
                {item.title}
              </NavLink>
            ))}
            <NavLink
              to="/favoris"
              aria-label={`Mes favoris (${favoritesCount})`}
              title="Mes favoris"
              className={({ isActive }) => `${desktopLinkClass({ isActive })} !px-2`}
            >
              <Heart className={`w-5 h-5 ${favoritesCount > 0 ? "fill-current" : ""}`} />
              {favoritesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </NavLink>
            <Link to="/contact" className="ml-4">
              <Button variant="accent" size="sm">
                Nous contacter
              </Button>
            </Link>
          </div>

          {/* Mobile: favoris + menu */}
          <div className="flex items-center gap-1 lg:hidden">
            <Link
              to="/favoris"
              aria-label={`Mes favoris (${favoritesCount})`}
              className={`relative p-2 ${isSolid ? "text-foreground" : "text-white"}`}
            >
              <Heart className={`w-6 h-6 ${favoritesCount > 0 ? "fill-current" : ""}`} />
              {favoritesCount > 0 && (
                <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </Link>
            <button
              className="p-2"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? (
                <X className={isSolid ? "text-foreground" : "text-white"} />
              ) : (
                <Menu className={isSolid ? "text-foreground" : "text-white"} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 top-16 bg-black/30"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div id="mobile-menu" className="lg:hidden relative bg-white shadow-lg border-t animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="px-4 py-3 space-y-1">
              {menuItems.map((item) => (
                <NavLink key={item.url} to={item.url} end={item.url === "/"} className={mobileLinkClass}>
                  {item.title}
                </NavLink>
              ))}
              <NavLink to="/favoris" className={mobileLinkClass}>
                <Heart className="w-4 h-4" />
                Mes favoris
                {favoritesCount > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {favoritesCount}
                  </span>
                )}
              </NavLink>
              <div className="pt-2 pb-1">
                <Link to="/contact">
                  <Button variant="accent" size="lg" className="w-full">
                    Nous contacter
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
