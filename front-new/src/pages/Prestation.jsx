import {
  Check, Home, KeyRound, FileText, Map, Car, CreditCard,
  Building2, UserRound, Globe, Phone, Mail, MapPin
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePageTitle } from "@/hooks/usePageTitle";

const services = [
  {
    icon: Home, title: "Vente Immobilière", price: "Commission : 5%",
    description: "Nous vous accompagnons dans la vente de votre bien immobilier avec une expertise locale reconnue.",
    features: ["Estimation gratuite de votre bien", "Marketing professionnel", "Visites accompagnées", "Négociation et suivi", "Accompagnement juridique"],
  },
  {
    icon: KeyRound, title: "Location et Gestion", price: "À partir de 8%", isPopular: true,
    description: "Gestion complète de vos biens locatifs pour optimiser votre investissement immobilier.",
    features: ["Recherche de locataires", "Rédaction des baux", "Gestion des loyers", "Entretien et réparations", "Suivi administratif"],
  },
  {
    icon: FileText, title: "Mutation Propriété", price: "150 000 Ar",
    description: "Accompagnement complet pour les mutations de propriétés immobilières à Madagascar.",
    features: ["Dossier de mutation", "Vérification des titres", "Suivi administratif", "Négociation avec les services", "Finalisation des documents"],
  },
  {
    icon: Map, title: "Mutation Terrain", price: "200 000 Ar",
    description: "Expertise spécialisée pour les mutations de terrains et formalités foncières.",
    features: ["Étude des titres fonciers", "Dossier de mutation", "Suivi aux services topographiques", "Mise à jour cadastrale", "Remise des nouveaux titres"],
  },
  {
    icon: Car, title: "Mutation Véhicule", price: "80 000 Ar",
    description: "Service complet pour les mutations de véhicules et changements de propriétaire.",
    features: ["Dossier de mutation", "Contrôle technique", "Suivi SAMIFIN", "Nouvelle carte grise", "Assurance véhicule"],
  },
  {
    icon: CreditCard, title: "Visas & Carte de Résident", price: "300 000 Ar",
    description: "Accompagnement pour visas long séjour et cartes de résident à Madagascar.",
    features: ["Constitution du dossier", "Suivi des démarches", "Rendez-vous consulaires", "Renouvellement de visa", "Carte de résident permanent"],
  },
  {
    icon: Building2, title: "Création de Société", price: "500 000 Ar",
    description: "Création et immatriculation de sociétés (SARL, SA, SAS) à Madagascar.",
    features: ["Rédaction des statuts", "Immatriculation RCS", "Numéro statistique", "Autorisation d'exercer", "Compte bancaire professionnel"],
  },
  {
    icon: UserRound, title: "Entreprise Individuelle", price: "150 000 Ar",
    description: "Création d'entreprise individuelle et formalités d'auto-entrepreneur.",
    features: ["Déclaration d'existence", "Numéro statistique", "Carte professionnelle", "Régime fiscal simplifié", "Suivi comptable de base"],
  },
  {
    icon: Globe, title: "Aide à l'Intégration", price: "Pack : 500 000 Ar",
    description: "Accompagnement personnalisé pour les expatriés souhaitant s'installer à Madagascar.",
    features: ["Recherche de logement", "Formalités administratives", "Ouverture de comptes", "Scolarisation des enfants", "Intégration culturelle"],
  },
];

function Prestation() {
  usePageTitle("Nos prestations");
  return (
    <>
      <Navbar />
      <div className="pt-20">
        {/* Header */}
        <div className="bg-primary py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Nos Prestations de Service
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              ImmoTuléar vous accompagne dans tous vos projets immobiliers avec
              des services professionnels et personnalisés
            </p>
          </div>
        </div>

        {/* Services Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card
                key={service.title}
                className={`relative overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 ${
                  service.isPopular ? "ring-2 ring-accent" : ""
                }`}
              >
                {service.isPopular && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="accent">Populaire</Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <service.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{service.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {service.description}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t">
                    <div className="text-lg font-bold text-primary mb-3">
                      {service.price}
                    </div>
                    <Link to={`/contact?sujet=${encodeURIComponent(`Devis : ${service.title}`)}`}>
                      <Button variant="outline" className="w-full">
                        Demander un devis
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-secondary/50 py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-10">
                <h2 className="text-2xl font-bold mb-3">
                  Besoin d'un service personnalisé ?
                </h2>
                <p className="text-muted-foreground mb-8">
                  Contactez-nous pour discuter de vos besoins spécifiques.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="flex items-center gap-3 justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                    <a href="tel:+261320260043" className="text-sm hover:text-primary">+261 32 02 600 43</a>
                  </div>
                  <div className="flex items-center gap-3 justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                    <a href="mailto:info@immotulear.mg" className="text-sm hover:text-primary">info@immotulear.mg</a>
                  </div>
                  <div className="flex items-center gap-3 justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="text-sm">Centre Ville, Tuléar</span>
                  </div>
                </div>

                <Link to={`/contact?sujet=${encodeURIComponent("Demande de rendez-vous")}`}>
                  <Button variant="accent" size="lg">
                    Demander un rendez-vous
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Prestation;
