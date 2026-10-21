import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const TABS = [
  { value: "sale", label: "Acheter", path: "/Avendre" },
  { value: "rent", label: "Louer", path: "/Alouer" },
];
const TYPES = ["Maison", "Villa", "Appartement", "Terrain"];

const Hero = ({ image, title, subtitle }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState("sale");
  const [type, setType] = useState("");
  const navigate = useNavigate();

  // Envoie vers la liste correspondante avec les critères dans l'URL (même sans mot-clé)
  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (type) params.set("type", type);
    const target = TABS.find((t) => t.value === tab).path;
    navigate(params.toString() ? `${target}?${params}` : target);
  };

  return (
    <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <img
          src={image}
          alt=""
          fetchPriority="high"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <motion.h1 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto"
          >
            {subtitle}
          </motion.p>
        )}
        
        {/* Search Bar */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white/95 backdrop-blur-sm rounded-xl p-3 max-w-3xl mx-auto shadow-2xl text-left"
        >
          <div className="flex gap-1 mb-3" role="tablist" aria-label="Type de recherche">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                role="tab"
                aria-selected={tab === t.value}
                onClick={() => setTab(t.value)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  tab === t.value ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary focus-within:ring-2 focus-within:ring-primary/40">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                type="search"
                aria-label="Quartier, mot-clé…"
                placeholder="Quartier, mot-clé…"
                className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              aria-label="Type de bien"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="sm:w-40 px-3 py-2.5 rounded-lg bg-secondary text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Tous les types</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <Button type="submit" variant="accent" size="lg">
              Rechercher
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
