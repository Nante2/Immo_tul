import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  MapPin, BedDouble, Bath, Maximize, Phone, Mail,
  Check, ArrowLeft, Home, Share2, MessageCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import FavoriteButton from "@/components/FavoriteButton";
import PropertyCard from "@/components/PropertyCard";
import ImageGallery from "@/components/ImageGallery";
import { WHATSAPP_NUMBER } from "@/components/WhatsAppButton";
import { getPropertyById, getSimilarProperties, submitContact } from "@/services/api";
import { usePageTitle } from "@/hooks/usePageTitle";
import { addRecentlyViewed } from "@/lib/recentlyViewed";
import RecentlyViewed from "@/components/RecentlyViewed";
import LoanSimulator from "@/components/LoanSimulator";

const PHONE_NUMBER = "+261320260043";

const safeParse = (data, fallback) => {
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return fallback; }
  }
  return data || fallback;
};

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactData, setContactData] = useState({ name: '', email: '', phone: '', message: '' });
  const [contactStatus, setContactStatus] = useState('idle');
  const [similar, setSimilar] = useState([]);
  const [shareStatus, setShareStatus] = useState('');

  // Réinitialise la page quand on passe d'un bien à un autre (ex: clic sur un bien similaire)
  const [currentId, setCurrentId] = useState(id);
  if (id !== currentId) {
    setCurrentId(id);
    setLoading(true);
    setShowContactForm(false);
    setContactStatus('idle');
    setSimilar([]);
  }

  useEffect(() => {
    let cancelled = false;
    getPropertyById(id).then(data => {
      if (cancelled) return;
      setProperty(data);
      setLoading(false);
      addRecentlyViewed(data);
    }).catch((err) => {
      if (cancelled) return;
      console.error(err);
      setProperty(null);
      setLoading(false);
    });
    getSimilarProperties(id, 3)
      .then(data => { if (!cancelled) setSimilar(data || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  usePageTitle(loading ? null : property ? property.titre : "Bien introuvable");

  // Revient à la liste précédente (avec ses filtres) si on vient du site, sinon vers la catégorie
  const goBack = () => {
    if (location.key !== "default") navigate(-1);
    else navigate(property?.actionType === "rent" ? "/Alouer" : "/Avendre");
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: property.titre, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareStatus('Lien copié !');
        setTimeout(() => setShareStatus(''), 2500);
      }
    } catch {
      // Partage annulé par l'utilisateur
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactStatus('loading');
    try {
      await submitContact({
        ...contactData,
        propertyId: property.id,
        subject: `Intéressé par: ${property.titre}`
      });
      setContactStatus('success');
    } catch {
      setContactStatus('error');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pt-20 bg-secondary/30 min-h-screen" aria-busy="true" aria-label="Chargement du bien">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
            <div className="h-4 w-36 bg-secondary rounded mb-8" />
            <div className="flex flex-col lg:flex-row lg:justify-between gap-4 mb-8">
              <div className="space-y-3">
                <div className="h-5 w-48 bg-secondary rounded" />
                <div className="h-9 w-80 max-w-full bg-secondary rounded" />
                <div className="h-5 w-56 bg-secondary rounded" />
              </div>
              <div className="h-10 w-56 bg-secondary rounded" />
            </div>
            <div className="h-[280px] sm:h-[380px] md:h-[500px] bg-secondary rounded-2xl mb-10" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-28 bg-secondary rounded-xl" />
                <div className="h-40 bg-secondary rounded-xl" />
              </div>
              <div className="h-72 bg-secondary rounded-xl" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!property) {
    return (
      <>
        <Navbar />
        <div className="pt-20 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Home className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Propriété non trouvée</h1>
            <p className="text-muted-foreground mb-8">
              La propriété que vous recherchez n'existe pas.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/Avendre">
                <Button variant="accent" size="lg">Voir les biens disponibles</Button>
              </Link>
              <Link to="/">
                <Button variant="outline" size="lg">Accueil</Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const statusMap = {
    available: { label: "Disponible", variant: "success" },
    reserved: { label: "Réservé", variant: "warning" },
    sold: { label: "Vendu", variant: "destructive" },
  };
  const status = statusMap[property.status] || statusMap.available;

  const images = safeParse(property.images, []);
  if (images.length === 0 && property.image) images.push(property.image);
  const features = safeParse(property.features, []);
  const details = { ...safeParse(property.details, {}) };
  if (property.area) details["Surface"] = property.area;
  if (property.beds) details["Chambres"] = property.beds;
  if (property.baths) details["Salles de bain"] = property.baths;

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Bonjour, je suis intéressé(e) par le bien « ${property.titre} » (${property.prix}) : ${window.location.href}`
  )}`;

  return (
    <>
      <Navbar />
      <div className="pt-20 pb-24 lg:pb-0 bg-secondary/30 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Fil d'Ariane + retour */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Retour aux résultats</span>
            </button>
            <nav aria-label="Fil d'Ariane" className="hidden sm:block text-sm text-muted-foreground">
              <ol className="flex items-center gap-2">
                <li><Link to="/" className="hover:text-foreground">Accueil</Link></li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link to={property.actionType === "rent" ? "/Alouer" : "/Avendre"} className="hover:text-foreground">
                    {property.actionType === "rent" ? "À louer" : "À vendre"}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-foreground font-medium truncate max-w-[16rem]">{property.titre}</li>
              </ol>
            </nav>
          </div>

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant={property.actionType === "rent" ? "accent" : "default"}>
                  {property.actionType === "rent" ? "À louer" : "À vendre"}
                </Badge>
                <Badge variant={status.variant}>{status.label}</Badge>
                <Badge variant="secondary">{property.type}</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {property.titre}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5" />
                <span className="text-lg">{property.location}</span>
              </div>
            </div>
            <div className="flex flex-col items-start lg:items-end gap-3">
              <div className="text-3xl md:text-4xl font-bold text-primary">
                {property.prix}
              </div>
              <div className="flex items-center gap-2">
                <FavoriteButton propertyId={property.id} withLabel />
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 rounded-full bg-white/90 shadow-sm border px-4 py-2 text-sm font-medium transition-all hover:bg-white hover:scale-105"
                >
                  <Share2 className="w-4 h-4" />
                  {shareStatus || "Partager"}
                </button>
              </div>
            </div>
          </div>

          <ImageGallery key={property.id} images={images} title={property.titre} />

          {/* Content + Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Specs */}
              <div className="grid grid-cols-3 gap-4">
                {property.beds && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-5 text-center">
                      <BedDouble className="w-7 h-7 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">{property.beds}</div>
                      <div className="text-xs text-muted-foreground">Chambres</div>
                    </CardContent>
                  </Card>
                )}
                {property.baths && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-5 text-center">
                      <Bath className="w-7 h-7 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold">{property.baths}</div>
                      <div className="text-xs text-muted-foreground">Salles de bain</div>
                    </CardContent>
                  </Card>
                )}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5 text-center">
                    <Maximize className="w-7 h-7 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{property.area}</div>
                    <div className="text-xs text-muted-foreground">Surface</div>
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8">
                  <h2 className="text-xl font-bold mb-4">Description</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {property.description}
                  </p>
                </CardContent>
              </Card>

              {/* Features */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8">
                  <h2 className="text-xl font-bold mb-4">Caractéristiques</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Details Table */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8">
                  <h2 className="text-xl font-bold mb-4">Détails</h2>
                  <div className="divide-y">
                    {Object.entries(details).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between py-3"
                      >
                        <span className="text-muted-foreground text-sm capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="font-medium text-sm">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {property.actionType === "sale" && property.status !== "sold" && property.priceNumeric > 0 && (
                <LoanSimulator price={property.priceNumeric} />
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-sm sticky top-28">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-6">Contactez-nous</h3>

                  <div className="space-y-4 mb-8">
                    <a
                      href="tel:+261320260043"
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">+261 32 02 600 43</div>
                        <div className="text-xs text-muted-foreground">Ligne principale</div>
                      </div>
                    </a>
                    <a
                      href="tel:+261320511222"
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">+261 32 05 112 22</div>
                        <div className="text-xs text-muted-foreground">Ligne secondaire</div>
                      </div>
                    </a>
                    <a
                      href="mailto:info@immotulear.mg"
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">info@immotulear.mg</div>
                        <div className="text-xs text-muted-foreground">Email</div>
                      </div>
                    </a>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">Centre Ville</div>
                        <div className="text-xs text-muted-foreground">
                          Angle Rue du marché, Bd Galliéni
                        </div>
                      </div>
                    </div>
                  </div>

                  {!showContactForm ? (
                    <Button variant="accent" size="lg" className="w-full" onClick={() => setShowContactForm(true)}>
                      {property.actionType === "rent" ? "Demander une visite" : "Je suis intéressé(e)"}
                    </Button>
                  ) : contactStatus === 'success' ? (
                    <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm text-center border border-green-200">
                      Votre message a été envoyé avec succès. Nous vous recontacterons bientôt !
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-3 mt-6 border-t pt-6">
                      <h4 className="font-semibold text-sm mb-3">Envoyer un message</h4>
                      {contactStatus === 'error' && <div className="text-red-500 text-xs">Erreur lors de l'envoi.</div>}
                      <input required type="text" placeholder="Votre nom" className="w-full text-sm border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-primary" value={contactData.name} onChange={e => setContactData({...contactData, name: e.target.value})} />
                      <input required type="email" placeholder="Votre email" className="w-full text-sm border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-primary" value={contactData.email} onChange={e => setContactData({...contactData, email: e.target.value})} />
                      <input type="tel" placeholder="Votre téléphone" className="w-full text-sm border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-primary" value={contactData.phone} onChange={e => setContactData({...contactData, phone: e.target.value})} />
                      <textarea required placeholder="Votre message..." rows={3} className="w-full text-sm border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-primary" value={contactData.message} onChange={e => setContactData({...contactData, message: e.target.value})} />
                      <div className="flex gap-2 pt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setShowContactForm(false)}>Annuler</Button>
                        <Button type="submit" variant="accent" className="flex-1" disabled={contactStatus === 'loading'}>
                          {contactStatus === 'loading' ? 'Envoi...' : 'Envoyer'}
                        </Button>
                      </div>
                    </form>
                  )}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5b]"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Contacter sur WhatsApp
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Biens similaires */}
          {similar.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold mb-6">Biens similaires</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {similar.map((item) => (
                  <PropertyCard key={item.id} property={item} />
                ))}
              </div>
            </section>
          )}
        </div>
        <RecentlyViewed excludeId={property.id} />
      </div>

      {/* Barre d'action fixe sur mobile */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-white/95 backdrop-blur-sm px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{property.titre}</p>
            <p className="font-bold text-primary truncate">{property.prix}</p>
          </div>
          <a
            href={`tel:${PHONE_NUMBER}`}
            aria-label="Appeler l'agence"
            className="flex h-11 w-11 items-center justify-center rounded-lg border text-primary"
          >
            <Phone className="w-5 h-5" />
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-semibold text-white"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </a>
        </div>
      </div>

      <Footer showWhatsApp={false} />
    </>
  );
};

export default PropertyDetails;

