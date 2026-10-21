import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Handshake, Star, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { usePageTitle } from "@/hooks/usePageTitle";

function Apropos() {
  usePageTitle("À propos");
  const fadeUpVariant = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative h-[50vh] min-h-[350px] flex items-center justify-center overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <img src="/image/Vclaire.jpg" alt="A propos" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </motion.div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            À propos d'ImmoTuléar
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg text-white/80"
          >
            Votre partenaire immobilier de confiance depuis 2012
          </motion.p>
        </div>
      </section>

      {/* Qui sommes-nous */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial="hidden" 
              whileInView="visible" 
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUpVariant}
            >
              <h2 className="text-3xl font-bold mb-6">Qui nous sommes</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Créé en 2012, par Monsieur Thierry Losfeld (spécialiste en
                énergie renouvelable et gérant de sqVISION Madagascar et
                Belgique) ImmoTuléar connaît progressivement un fort
                développement grâce à l'application rigoureuse de méthodes de
                management et de contrôle qualité.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                En début 2015, l'équipe se renforce avec la collaboration de
                Madame Buscotine.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-2 gap-4"
            >
              <img
                src="/image/Vclaire.jpg"
                alt="ImmoTuléar"
                className="rounded-2xl w-full h-64 object-cover shadow-lg"
              />
              <img
                src="/image/Vclaire2.jpg"
                alt="ImmoTuléar"
                className="rounded-2xl w-full h-64 object-cover shadow-lg mt-8"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* La qualité */}
      <section className="py-20 bg-secondary/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1 grid grid-cols-2 gap-4"
            >
              <img
                src="/image/Vclaire.jpg"
                alt="Qualité"
                className="rounded-2xl w-full h-64 object-cover shadow-lg mt-8"
              />
              <img
                src="/image/Vclaire2.jpg"
                alt="Qualité"
                className="rounded-2xl w-full h-64 object-cover shadow-lg"
              />
            </motion.div>
            
            <motion.div 
              initial="hidden" 
              whileInView="visible" 
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUpVariant}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl font-bold mb-6">La Qualité</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Une préoccupation fondamentale traduite par un programme
                exigeant. Le secteur des services, et plus particulièrement
                celui de l'immobilier, suivi de l'aide à l'intégration de
                l'étranger à Madagascar, évolue dans un environnement
                réglementaire, socioéconomique, culturel et technique en pleine
                mutation.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                C'est une garantie de sécurité et de transparence vis-à-vis des
                clients.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                ImmoTuléar reste également celui qui inspire le plus confiance
                pour acheter, vendre, louer ou gérer son bien immobilier et ses
                équipes reconnues pour être les mieux formées et les plus
                professionnelles.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            Nos Valeurs
          </motion.h2>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: Handshake, title: "Confiance", desc: "Relations transparentes et honnêtes avec tous nos clients" },
              { icon: Star, title: "Excellence", desc: "Un service de qualité supérieure dans chaque interaction" },
              { icon: Globe, title: "Proximité", desc: "Une connaissance approfondie du marché local de Toliara" },
            ].map((v, i) => (
              <motion.div key={v.title} variants={fadeUpVariant}>
                <Card className="border-0 shadow-sm text-center h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <v.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{v.title}</h3>
                    <p className="text-sm text-muted-foreground">{v.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Apropos;
