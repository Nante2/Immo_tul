import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Phone, Mail, MapPin, MessageCircle, CheckCircle2, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { submitContact } from "@/services/api";
import { usePageTitle } from "@/hooks/usePageTitle";
import { WHATSAPP_NUMBER } from "@/components/WhatsAppButton";

const SUBJECTS = [
  "Achat d'un bien",
  "Location d'un bien",
  "Mettre mon bien en vente ou en location",
  "Gestion locative",
  "Démarches administratives (mutation, visa…)",
  "Autre demande",
];

const EMPTY_FORM = { name: "", email: "", phone: "", subject: SUBJECTS[0], message: "" };

const inputClass =
  "w-full text-sm border rounded-lg px-3 py-2.5 bg-background outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30";

const contactInfos = [
  { icon: Phone, label: "Téléphone", lines: [
    { text: "+261 32 02 600 43", href: "tel:+261320260043" },
    { text: "+261 32 05 112 22", href: "tel:+261320511222" },
  ] },
  { icon: Mail, label: "Email", lines: [{ text: "info@immotulear.mg", href: "mailto:info@immotulear.mg" }] },
  { icon: MapPin, label: "Agence", lines: [{ text: "Angle Rue du marché, Bd Galliéni" }, { text: "601 Tuléar (Centre Ville)" }] },
];

function Contact() {
  usePageTitle("Contact");
  const [searchParams] = useSearchParams();
  // Sujet pré-rempli depuis un lien (ex: « Demander un devis » sur la page Prestations)
  const presetSubject = searchParams.get("sujet")?.slice(0, 200) || "";
  const subjects = presetSubject && !SUBJECTS.includes(presetSubject) ? [presetSubject, ...SUBJECTS] : SUBJECTS;
  const initialForm = { ...EMPTY_FORM, subject: presetSubject || SUBJECTS[0] };
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      await submitContact(form);
      setStatus("success");
      setForm(initialForm);
    } catch (err) {
      setStatus("error");
      setError(err.message || "Une erreur est survenue. Veuillez réessayer.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="pt-20">
        <div className="bg-primary py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Contactez-nous</h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Un projet d'achat, de location ou une démarche administrative ? Notre équipe vous répond rapidement.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Formulaire */}
            <Card className="lg:col-span-3 border-0 shadow-sm">
              <CardContent className="p-6 sm:p-8">
                {status === "success" ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Message envoyé !</h2>
                    <p className="text-muted-foreground mb-8">
                      Merci pour votre message. Nous vous recontacterons dans les plus brefs délais.
                    </p>
                    <Button variant="outline" onClick={() => setStatus("idle")}>
                      Envoyer un autre message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <h2 className="text-xl font-bold">Envoyez-nous un message</h2>
                    {status === "error" && (
                      <div role="alert" className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                        {error}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="c-name" className="block text-sm font-medium mb-1.5">Nom complet *</label>
                        <input id="c-name" required autoComplete="name" className={inputClass} value={form.name} onChange={update("name")} />
                      </div>
                      <div>
                        <label htmlFor="c-email" className="block text-sm font-medium mb-1.5">Email *</label>
                        <input id="c-email" type="email" required autoComplete="email" className={inputClass} value={form.email} onChange={update("email")} />
                      </div>
                      <div>
                        <label htmlFor="c-phone" className="block text-sm font-medium mb-1.5">Téléphone</label>
                        <input id="c-phone" type="tel" autoComplete="tel" placeholder="+261 ..." className={inputClass} value={form.phone} onChange={update("phone")} />
                      </div>
                      <div>
                        <label htmlFor="c-subject" className="block text-sm font-medium mb-1.5">Sujet *</label>
                        <select id="c-subject" className={inputClass} value={form.subject} onChange={update("subject")}>
                          {subjects.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="c-message" className="block text-sm font-medium mb-1.5">Message *</label>
                      <textarea
                        id="c-message"
                        required
                        rows={6}
                        placeholder="Décrivez votre projet : type de bien, budget, quartier souhaité…"
                        className={inputClass}
                        value={form.message}
                        onChange={update("message")}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <Button type="submit" variant="accent" size="lg" className="gap-2" disabled={status === "loading"}>
                        <Send className="w-4 h-4" />
                        {status === "loading" ? "Envoi en cours..." : "Envoyer le message"}
                      </Button>
                      <p className="text-xs text-muted-foreground">* Champs obligatoires</p>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Coordonnées */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 sm:p-8 space-y-6">
                  {contactInfos.map(({ icon: Icon, label, lines }) => (
                    <div key={label} className="flex gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
                        {lines.map((line) =>
                          line.href ? (
                            <a key={line.text} href={line.href} className="block font-medium hover:text-primary transition-colors">
                              {line.text}
                            </a>
                          ) : (
                            <p key={line.text} className="font-medium">{line.text}</p>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5b]"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Discuter sur WhatsApp
                  </a>
                </CardContent>
              </Card>

              <div className="rounded-xl overflow-hidden shadow-sm border aspect-[4/3]">
                <iframe
                  title="Plan du centre-ville de Toliara"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=43.6640%2C-23.3620%2C43.6900%2C-23.3420&layer=mapnik"
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Contact;
