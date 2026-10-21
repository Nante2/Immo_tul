import { MessageCircle } from "lucide-react";

export const WHATSAPP_NUMBER = "261320260043";

// Bouton flottant présent sur les pages publiques
const WhatsAppButton = () => (
  <a
    href={`https://wa.me/${WHATSAPP_NUMBER}`}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Nous écrire sur WhatsApp"
    title="Nous écrire sur WhatsApp"
    className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40 print:hidden"
  >
    <MessageCircle className="h-7 w-7" />
  </a>
);

export default WhatsAppButton;
