import type { MessageSender } from "@prisma/client";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";

export interface ChatTurn {
  sender: MessageSender;
  body: string;
}

export interface AssistantResult {
  reply: string;
  /** True when the assistant recommends escalating to a human agent. */
  suggestHandoff: boolean;
}

const HANDOFF_PATTERNS =
  /\b(human|agent|representative|person|someone|operator|manager|humain|agent|personne|repr[ée]sentant|parler[ àa] quelqu)\b/i;

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

function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/\b(hi|hello|hey|bonjour|salut|allo)\b/.test(t)) return "greeting";
  if (/\b(price|prices|cost|fare|estimate|quote|prix|co[uû]t|tarif|estimation)\b/.test(t))
    return "pricing";
  if (/\b(cancel|refund|annul|rembours)\b/.test(t)) return "cancel";
  if (/\b(airport|flight|yul|yqb|a[ée]roport|vol)\b/.test(t)) return "airport";
  if (/\b(where|area|city|cities|coverage|serve|zone|ville|couvrez|desserv)\b/.test(t))
    return "coverage";
  if (/\b(hour|hours|open|24\/7|schedule|heure|ouvert|horaire)\b/.test(t))
    return "hours";
  if (/\b(pay|payment|card|cash|paie|paiement|carte|comptant)\b/.test(t))
    return "payment";
  if (/\b(track|where is|driver|status|suivi|chauffeur|statut|o[uù] est)\b/.test(t))
    return "track";
  if (/\b(book|booking|reserve|reservation|ride|r[ée]serv|course|trajet)\b/.test(t))
    return "booking";
  return "fallback";
}

const RESPONSES: Record<"fr" | "en", Record<Intent, string>> = {
  en: {
    greeting:
      "Hi! I'm the TAXIMOVQC assistant. I can help with pricing, booking a ride, airport transfers and coverage. How can I help?",
    pricing:
      "Our prices are fixed and shown before you confirm — no surge pricing. You can get an instant estimate on our booking page by entering your pickup and destination.",
    booking:
      "You can book directly on our site: choose your trip, pick a vehicle (Sedan, SUV, Van or Luxury) and confirm. Would you like the link to the booking page?",
    cancel:
      "To change or cancel a booking, share your reference number (starts with QR-) and I can help, or I can connect you to an agent.",
    airport:
      "We offer airport transfers to and from YUL and YQB with flight tracking and meet-and-greet. Just enter the airport as your destination when booking.",
    coverage:
      "We serve Montreal, Quebec City, Laval, Gatineau, Sherbrooke, Trois-Rivières, Longueuil and the YUL/YQB airports. Let me know your city!",
    hours:
      "We operate 24 hours a day, 7 days a week — you can book any time.",
    payment:
      "You can pay by card online, or choose cash or a corporate account. The fixed price is confirmed before departure.",
    track:
      "To track your ride or check a driver's status, please share your booking reference (QR-…). For live status I can also connect you to an agent.",
    fallback:
      "I want to make sure you get the right answer. Could you rephrase, or would you like me to connect you with a human agent?",
  },
  fr: {
    greeting:
      "Bonjour ! Je suis l'assistant TAXIMOVQC. Je peux vous aider avec les prix, la réservation, les transferts aéroport et la couverture. Comment puis-je vous aider ?",
    pricing:
      "Nos prix sont fixes et affichés avant la confirmation — sans tarification dynamique. Vous pouvez obtenir une estimation instantanée sur la page de réservation en indiquant le départ et la destination.",
    booking:
      "Vous pouvez réserver directement sur notre site : choisissez votre trajet, sélectionnez un véhicule (Berline, VUS, Van ou Luxe) et confirmez. Voulez-vous le lien vers la page de réservation ?",
    cancel:
      "Pour modifier ou annuler une réservation, indiquez votre numéro de référence (commence par QR-) et je peux vous aider, ou je peux vous mettre en relation avec un agent.",
    airport:
      "Nous offrons des transferts aéroport vers et depuis YUL et YQB avec suivi des vols et accueil à l'arrivée. Indiquez simplement l'aéroport comme destination lors de la réservation.",
    coverage:
      "Nous desservons Montréal, Québec, Laval, Gatineau, Sherbrooke, Trois-Rivières, Longueuil et les aéroports YUL/YQB. Dites-moi votre ville !",
    hours: "Nous sommes disponibles 24 heures sur 24, 7 jours sur 7 — réservez à tout moment.",
    payment:
      "Vous pouvez payer par carte en ligne, ou choisir comptant ou un compte corporatif. Le prix fixe est confirmé avant le départ.",
    track:
      "Pour suivre votre course ou vérifier le statut d'un chauffeur, indiquez votre numéro de référence (QR-…). Pour un statut en direct, je peux aussi vous mettre en relation avec un agent.",
    fallback:
      "Je veux m'assurer de bien vous répondre. Pouvez-vous reformuler, ou souhaitez-vous que je vous mette en relation avec un agent ?",
  },
};

/**
 * Generates an assistant reply. Uses OpenAI when OPENAI_API_KEY is configured,
 * otherwise falls back to a deterministic rule-based responder.
 */
export async function generateAssistantReply(params: {
  locale: string;
  text: string;
  history: ChatTurn[];
}): Promise<AssistantResult> {
  const locale = params.locale === "en" ? "en" : "fr";
  const suggestHandoff =
    HANDOFF_PATTERNS.test(params.text) ||
    detectIntent(params.text) === "fallback";

  if (env.openaiApiKey) {
    try {
      const reply = await callOpenAI(locale, params.text, params.history);
      if (reply) return { reply, suggestHandoff };
    } catch (err) {
      logger.warn(
        `OpenAI call failed, falling back to rules: ${(err as Error).message}`,
      );
    }
  }

  const intent = detectIntent(params.text);
  return { reply: RESPONSES[locale][intent], suggestHandoff };
}

async function callOpenAI(
  locale: "fr" | "en",
  text: string,
  history: ChatTurn[],
): Promise<string | null> {
  const system =
    locale === "fr"
      ? "Tu es l'assistant du service client de TAXIMOVQC, une plateforme de taxi au Québec. Réponds brièvement, poliment et en français. Sujets : prix fixes, réservation en ligne, transferts aéroport (YUL/YQB), couverture au Québec, paiement, disponibilité 24/7. Si tu ne peux pas aider, propose de transférer à un agent humain."
      : "You are the customer support assistant for TAXIMOVQC, a taxi platform in Quebec, Canada. Reply briefly and politely in English. Topics: fixed pricing, online booking, airport transfers (YUL/YQB), Quebec coverage, payment, 24/7 availability. If you cannot help, offer to hand off to a human agent.";

  const messages = [
    { role: "system", content: system },
    ...history.slice(-8).map((t) => ({
      role: t.sender === "CUSTOMER" ? "user" : "assistant",
      content: t.body,
    })),
    { role: "user", content: text },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: env.openaiModel,
      messages,
      max_tokens: 250,
      temperature: 0.4,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}
