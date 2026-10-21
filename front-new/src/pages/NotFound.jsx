import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";

function NotFound() {
  usePageTitle("Page introuvable");
  return (
    <>
      <Navbar />
      <div className="pt-20 min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <SearchX className="w-12 h-12 text-primary" />
          </div>
          <p className="text-sm font-semibold text-accent mb-2">Erreur 404</p>
          <h1 className="text-3xl font-bold mb-3">Page introuvable</h1>
          <p className="text-muted-foreground mb-8">
            La page que vous cherchez n'existe pas ou a été déplacée.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/">
              <Button variant="accent" size="lg">Retour à l'accueil</Button>
            </Link>
            <Link to="/Avendre">
              <Button variant="outline" size="lg">Voir les biens</Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default NotFound;
