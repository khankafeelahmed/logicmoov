import type { Locale } from "@/i18n/config";

/**
 * Client-side fallback assistant. Mirrors the backend rule-based responder so
 * customers always get instant answers even when the API/backend is offline.
 * When the backend is reachable, the widget uses it instead (persistence +
 * live-agent handoff + optional LLM).
 */

type Intent =
  | "greeting"
  | "pricing"
  | "booking"
  | "cancel"
  | "airport"
  | "coverage"
  | "hours"
  | "payment"
  | "track"
  | "fallback";

const HANDOFF =
  /\b(human|agent|representative|person|someone|operator|manager|humain|personne|repr[ée]sentant|parler[ àa] quelqu)\b/i;

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/\b(hi|hello|hey|bonjour|salut|allo)\b/.test(t)) return "greeting";
  if (/\b(price|prices|cost|fare|estimate|quote|prix|co[uû]t|tarif|estimation)\b/.test(t))
    return "pricing";
  if (/\b(cancel|refund|annul|rembours)\b/.test(t)) return "cancel";
  if (/\b(airport|flight|yul|yqb|a[ée]roport|vol)\b/.test(t)) return "airport";
  if (/\b(where|area|city|cities|coverage|serve|zone|ville|couvrez|desserv)\b/.test(t))
    return "coverage";
  if (/\b(hour|hours|open|24\/7|schedule|heure|ouvert|horaire)\b/.test(t)) return "hours";
  if (/\b(pay|payment|card|cash|paie|paiement|carte|comptant)\b/.test(t)) return "payment";
  if (/\b(track|driver|status|suivi|chauffeur|statut)\b/.test(t)) return "track";
  if (/\b(book|booking|reserve|reservation|ride|r[ée]serv|course|trajet)\b/.test(t))
    return "booking";
  return "fallback";
}

const RESPONSES: Record<Locale, Record<Intent, string>> = {
  en: {
    greeting:
      "Hi! I'm the TAXIMOVQC assistant. I can help with pricing, booking a ride, airport transfers and coverage. How can I help?",
    pricing:
      "Our prices are fixed and shown before you confirm — no surge pricing. Get an instant estimate on our booking page by entering your pickup and destination.",
    booking:
      "You can book directly on our site: choose your trip, pick a vehicle (Sedan, SUV, Van or Luxury) and confirm. Head to the “Book” page to start.",
    cancel:
      "To change or cancel a booking, have your reference number ready (it starts with QR-) and call us at +1 (514) 555-0123 and we'll take care of it.",
    airport:
      "We offer airport transfers to and from YUL and YQB with flight tracking and meet-and-greet. Just enter the airport as your destination when booking.",
    coverage:
      "We serve Montreal, Quebec City, Laval, Gatineau, Sherbrooke, Trois-Rivières, Longueuil and the YUL/YQB airports.",
    hours: "We operate 24 hours a day, 7 days a week — you can book any time.",
    payment:
      "You can pay by card online, or choose cash or a corporate account. The fixed price is confirmed before departure.",
    track:
      "To track your ride or check a driver's status, please have your booking reference (QR-…) ready, or call us at +1 (514) 555-0123.",
    fallback:
      "I want to make sure you get the right answer. You can reach our team any time at +1 (514) 555-0123 or info@taximovqc.ca. Meanwhile, ask me about pricing, booking, airport transfers, coverage, hours or payment.",
  },
  fr: {
    greeting:
      "Bonjour ! Je suis l'assistant TAXIMOVQC. Je peux vous aider avec les prix, la réservation, les transferts aéroport et la couverture. Comment puis-je vous aider ?",
    pricing:
      "Nos prix sont fixes et affichés avant la confirmation — sans tarification dynamique. Obtenez une estimation instantanée sur la page de réservation en indiquant le départ et la destination.",
    booking:
      "Vous pouvez réserver directement sur notre site : choisissez votre trajet, sélectionnez un véhicule (Berline, VUS, Van ou Luxe) et confirmez. Rendez-vous sur la page « Réserver » pour commencer.",
    cancel:
      "Pour modifier ou annuler une réservation, ayez votre numéro de référence (commence par QR-) et appelez-nous au +1 (514) 555-0123 ; nous nous en occupons.",
    airport:
      "Nous offrons des transferts aéroport vers et depuis YUL et YQB avec suivi des vols et accueil à l'arrivée. Indiquez simplement l'aéroport comme destination lors de la réservation.",
    coverage:
      "Nous desservons Montréal, Québec, Laval, Gatineau, Sherbrooke, Trois-Rivières, Longueuil et les aéroports YUL/YQB.",
    hours: "Nous sommes disponibles 24 heures sur 24, 7 jours sur 7 — réservez à tout moment.",
    payment:
      "Vous pouvez payer par carte en ligne, ou choisir comptant ou un compte corporatif. Le prix fixe est confirmé avant le départ.",
    track:
      "Pour suivre votre course ou vérifier le statut d'un chauffeur, ayez votre numéro de référence (QR-…), ou appelez-nous au +1 (514) 555-0123.",
    fallback:
      "Je veux m'assurer de bien vous répondre. Vous pouvez joindre notre équipe à tout moment au +1 (514) 555-0123 ou info@taximovqc.ca. Entre-temps, posez-moi une question sur les prix, la réservation, les transferts aéroport, la couverture, les heures ou le paiement.",
  },
};

export function localAssistantReply(
  locale: Locale,
  text: string,
): { reply: string; suggestHandoff: boolean } {
  const intent = detectIntent(text);
  return {
    reply: RESPONSES[locale][intent],
    suggestHandoff: HANDOFF.test(text) || intent === "fallback",
  };
}
