import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Marie Rakoto",
    role: "Cliente - Achat maison",
    content:
      "Service exceptionnel ! ImmoTuléar m'a aidé à trouver la maison parfaite pour ma famille. L'équipe est très professionnelle et à l'écoute.",
  },
  {
    name: "Jean Dupont",
    role: "Entrepreneur français",
    content:
      "Excellent accompagnement pour la création de ma société. Toutes les démarches ont été simplifiées grâce à leur expertise.",
  },
  {
    name: "Hery Andriamana",
    role: "Propriétaire investisseur",
    content:
      "Gestion locative impeccable ! Mes biens sont entre de bonnes mains. Je recommande vivement leurs services.",
  },
];

const HomeTestimonials = () => {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ce que disent nos clients
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Découvrez les témoignages de nos clients satisfaits
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="border-0 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-8">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                {/* Content */}
                <p className="text-muted-foreground mb-6 italic leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeTestimonials;
