import { Home, FileText, CreditCard, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Home,
    title: "Immobilier",
    description: "Vente, location et gestion de biens immobiliers",
  },
  {
    icon: FileText,
    title: "Mutations",
    description: "Propriétés, terrains et véhicules",
  },
  {
    icon: CreditCard,
    title: "Visas & Résidence",
    description: "Long séjour et carte de résident",
  },
  {
    icon: Building2,
    title: "Création d'Entreprise",
    description: "Sociétés et entreprises individuelles",
  },
];

const HomeServices = () => {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Nos Services Principaux
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            ImmoTuléar vous accompagne dans tous vos projets immobiliers et
            administratifs
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <Card
              key={service.title}
              className="group text-center hover:shadow-lg transition-all duration-300 border-0 shadow-sm hover:-translate-y-1"
            >
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <service.icon className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/Prestation">
            <Button variant="accent" size="lg">
              Voir tous nos services
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeServices;
