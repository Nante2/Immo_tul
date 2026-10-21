import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";

const CURRENT_YEAR = new Date().getFullYear();

const services = [
  "Vente immobilière",
  "Location & Gestion",
  "Mutations",
  "Visas & Résidence",
  "Création d'entreprise",
];

const Footer = ({ showWhatsApp = true }) => {
  return (
    <footer className="bg-[#0a2540] text-white">
      {showWhatsApp && <WhatsAppButton />}
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold mb-4">
              Immo<span className="text-accent">Tuléar</span>
            </h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Votre partenaire immobilier de confiance à Toliara depuis 2012.
              Vente, location, gestion et services administratifs.
            </p>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>
                Angle Rue du marché, Bd Galliéni
                <br />
                601 Tuléar (Centre Ville)
              </span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white/90">Contact</h4>
            <div className="space-y-3">
              <a
                href="tel:+261320260043"
                className="flex items-center gap-2 text-white/60 hover:text-accent transition-colors text-sm"
              >
                <Phone className="w-4 h-4" />
                +261 32 02 600 43
              </a>
              <a
                href="tel:+261320511222"
                className="flex items-center gap-2 text-white/60 hover:text-accent transition-colors text-sm"
              >
                <Phone className="w-4 h-4" />
                +261 32 05 112 22
              </a>
              <a
                href="mailto:info@immotulear.mg"
                className="flex items-center gap-2 text-white/60 hover:text-accent transition-colors text-sm"
              >
                <Mail className="w-4 h-4" />
                info@immotulear.mg
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4 text-white/90">Navigation</h4>
            <div className="space-y-3">
              {[
                { label: "Accueil", url: "/" },
                { label: "À vendre", url: "/Avendre" },
                { label: "À louer", url: "/Alouer" },
                { label: "Prestations", url: "/Prestation" },
                { label: "À propos", url: "/Apropos" },
                { label: "Mes favoris", url: "/favoris" },
                { label: "Contact", url: "/contact" },
              ].map((link) => (
                <Link
                  key={link.url}
                  to={link.url}
                  className="block text-white/60 hover:text-accent transition-colors text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4 text-white/90">Services</h4>
            <div className="space-y-3 text-sm">
              {services.map((service) => (
                <Link
                  key={service}
                  to="/Prestation"
                  className="block text-white/60 hover:text-accent transition-colors"
                >
                  {service}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">
              © {CURRENT_YEAR} ImmoTuléar. Tous droits réservés.
            </p>
            <Link to="/contact" className="text-sm text-white/40 hover:text-white/70 transition-colors">
              Une question ? Contactez-nous
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
