import type { Locale } from "./config";

export type Dictionary = typeof fr;

const fr = {
  brand: {
    name: "LogicMoov",
    tagline: "Transport de taxi moderne au Québec",
  },
  nav: {
    home: "Accueil",
    howItWorks: "Comment ça marche",
    fleet: "Notre flotte",
    services: "Services",
    coverage: "Couverture",
    about: "À propos",
    contact: "Contact",
    book: "Réserver",
    callUs: "Appelez-nous",
    menu: "Menu",
  },
  hero: {
    badge: "Disponible 24/7 partout au Québec",
    title: "Votre course, simplifiée",
    titleAccent: "partout au Québec",
    subtitle:
      "Réservez un taxi fiable en quelques secondes. Prix fixes, chauffeurs professionnels et suivi en temps réel — de Montréal à Québec et au-delà.",
    ctaPrimary: "Réserver une course",
    ctaSecondary: "Voir comment ça marche",
    trust: "La confiance de milliers de voyageurs québécois",
  },
  stats: {
    rides: "Courses complétées",
    drivers: "Chauffeurs partenaires",
    cities: "Villes desservies",
    rating: "Note moyenne",
  },
  quickBook: {
    title: "Estimez votre course",
    pickup: "Point de départ",
    pickupPlaceholder: "Adresse de départ",
    dropoff: "Destination",
    dropoffPlaceholder: "Adresse d'arrivée",
    when: "Quand",
    now: "Maintenant",
    schedule: "Planifier",
    submit: "Obtenir une estimation",
    estimate: "Prix estimé",
    note: "Estimation indicative. Le prix final est confirmé avant le départ.",
  },
  services: {
    title: "Des services pour chaque trajet",
    subtitle:
      "Que ce soit pour l'aéroport, le travail ou une sortie, nous avons une solution adaptée.",
    items: [
      {
        title: "Transferts aéroport",
        description:
          "Trajets vers et depuis YUL et YQB avec suivi des vols et accueil à l'arrivée.",
      },
      {
        title: "Transport corporatif",
        description:
          "Comptes entreprise, facturation centralisée et chauffeurs discrets pour vos équipes.",
      },
      {
        title: "Courses en ville",
        description:
          "Déplacements urbains rapides à prix fixe, sans surprise ni tarification dynamique.",
      },
      {
        title: "Longue distance",
        description:
          "Voyages intervilles confortables entre Montréal, Québec, Laval, Gatineau et plus.",
      },
      {
        title: "Événements & groupes",
        description:
          "Vans et véhicules multiples pour mariages, congrès et déplacements de groupe.",
      },
      {
        title: "Transport médical",
        description:
          "Rendez-vous médicaux ponctuels avec chauffeurs attentionnés et ponctuels.",
      },
    ],
  },
  howItWorks: {
    title: "Réservez en trois étapes simples",
    subtitle: "Aucune application requise — réservez directement en ligne.",
    steps: [
      {
        title: "Indiquez votre trajet",
        description:
          "Entrez votre point de départ, votre destination et l'heure souhaitée.",
      },
      {
        title: "Choisissez votre véhicule",
        description:
          "Sélectionnez la catégorie qui vous convient et voyez le prix fixe à l'avance.",
      },
      {
        title: "Suivez et voyagez",
        description:
          "Recevez la confirmation, suivez votre chauffeur en temps réel et voyagez sereinement.",
      },
    ],
  },
  fleet: {
    title: "Une flotte pour chaque besoin",
    subtitle: "Des véhicules entretenus, propres et confortables.",
    perTrip: "à partir de",
    seats: "places",
    book: "Choisir",
    items: [
      {
        name: "Berline",
        description: "Idéale pour 1 à 3 passagers avec bagages standards.",
        seats: 4,
        price: "25 $",
      },
      {
        name: "VUS",
        description: "Plus d'espace pour les bagages et le confort.",
        seats: 5,
        price: "39 $",
      },
      {
        name: "Van",
        description: "Parfait pour les groupes et les familles nombreuses.",
        seats: 7,
        price: "59 $",
      },
      {
        name: "Luxe",
        description: "Berline haut de gamme pour vos déplacements d'affaires.",
        seats: 3,
        price: "79 $",
      },
    ],
  },
  features: {
    title: "Pourquoi choisir LogicMoov",
    subtitle:
      "Une plateforme moderne conçue pour la fiabilité et la tranquillité d'esprit.",
    items: [
      {
        title: "Prix fixes garantis",
        description:
          "Le prix affiché est le prix payé. Pas de tarification dynamique ni de mauvaises surprises.",
      },
      {
        title: "Disponible 24/7",
        description: "Réservez à toute heure, tous les jours de l'année.",
      },
      {
        title: "Suivi en temps réel",
        description:
          "Suivez votre chauffeur sur la carte et partagez votre trajet avec vos proches.",
      },
      {
        title: "Chauffeurs vérifiés",
        description:
          "Des professionnels formés, courtois et vérifiés pour votre sécurité.",
      },
      {
        title: "Suivi des vols",
        description:
          "Nos chauffeurs ajustent l'heure de prise en charge selon votre vol réel.",
      },
      {
        title: "Paiement flexible",
        description:
          "Payez par carte, en ligne ou avec un compte corporatif — au choix.",
      },
    ],
  },
  coverage: {
    title: "Nous couvrons tout le Québec",
    subtitle:
      "Service de taxi disponible dans les principales villes et aéroports de la province.",
    cities: [
      "Montréal",
      "Ville de Québec",
      "Laval",
      "Gatineau",
      "Sherbrooke",
      "Trois-Rivières",
      "Longueuil",
      "Aéroport YUL",
      "Aéroport YQB",
    ],
    cta: "Votre ville n'est pas listée ?",
    ctaLink: "Contactez-nous",
  },
  testimonials: {
    title: "Ce que disent nos clients",
    items: [
      {
        quote:
          "Réservation ultra simple et chauffeur à l'heure pour mon vol tôt le matin. Je recommande !",
        author: "Marie-Claude L.",
        role: "Montréal",
      },
      {
        quote:
          "Prix fixe annoncé à l'avance, aucune surprise. Parfait pour mes déplacements d'affaires.",
        author: "Jean-François T.",
        role: "Ville de Québec",
      },
      {
        quote:
          "Le suivi en temps réel m'a rassurée. Service propre, ponctuel et professionnel.",
        author: "Sophie R.",
        role: "Laval",
      },
    ],
  },
  cta: {
    title: "Prêt à réserver votre prochaine course ?",
    subtitle:
      "Obtenez un prix fixe en quelques secondes et voyagez l'esprit tranquille.",
    primary: "Réserver maintenant",
    secondary: "Nous appeler",
  },
  booking: {
    title: "Réservez votre course",
    subtitle: "Prix fixe confirmé avant le départ. Aucune application requise.",
    step: "Étape",
    of: "de",
    steps: {
      trip: "Trajet",
      vehicle: "Véhicule",
      details: "Coordonnées",
      confirm: "Confirmation",
    },
    tripType: "Type de trajet",
    oneWay: "Aller simple",
    roundTrip: "Aller-retour",
    pickup: "Point de départ",
    pickupPlaceholder: "Ex. 1000 Rue de la Gauchetière, Montréal",
    dropoff: "Destination",
    dropoffPlaceholder: "Ex. Aéroport Montréal-Trudeau (YUL)",
    date: "Date",
    time: "Heure",
    passengers: "Passagers",
    luggage: "Bagages",
    chooseVehicle: "Choisissez votre véhicule",
    estimatedPrice: "Prix estimé",
    fullName: "Nom complet",
    fullNamePlaceholder: "Votre nom",
    email: "Courriel",
    emailPlaceholder: "vous@exemple.com",
    phone: "Téléphone",
    phonePlaceholder: "(514) 555-0123",
    notes: "Notes (optionnel)",
    notesPlaceholder: "Numéro de vol, instructions spéciales…",
    back: "Retour",
    next: "Continuer le paiement",
    confirm: "Confirmer la réservation",
    summary: "Résumé de la réservation",
    successTitle: "Réservation confirmée !",
    successMessage:
      "Merci ! Votre demande a été reçue. Un chauffeur vous sera assigné et vous recevrez une confirmation par courriel.",
    reference: "Numéro de référence",
    newBooking: "Nouvelle réservation",
    required: "Ce champ est requis",
    invalidEmail: "Courriel invalide",
    submitting: "Traitement en cours…",
    errorTitle: "La réservation a échoué",
    errorGeneric:
      "Une erreur est survenue lors de la réservation. Veuillez réessayer.",
    errorNetwork:
      "Impossible de joindre le service de réservation. Assurez-vous que l'API est démarrée, puis réessayez.",
    retry: "Réessayer",
    paid: "Payé",
    demoNote:
      "Ceci est une démonstration. Aucun paiement réel n'est traité et aucun chauffeur n'est réellement envoyé.",
  },
  about: {
    title: "À propos de LogicMoov",
    lead: "Nous modernisons le transport de taxi au Québec avec une technologie fiable et un service humain.",
    body: [
      "LogicMoov est né d'une idée simple : rendre le transport en taxi transparent, ponctuel et accessible partout dans la province. Fini les tarifs imprévisibles et l'attente incertaine.",
      "Notre plateforme relie les voyageurs à un réseau de chauffeurs professionnels vérifiés, avec des prix fixes annoncés à l'avance et un suivi en temps réel de chaque course.",
      "Des transferts aéroport aux déplacements d'affaires, notre mission est de vous amener à destination en toute confiance, en français comme en anglais.",
    ],
    valuesTitle: "Nos valeurs",
    values: [
      { title: "Fiabilité", description: "Ponctualité et service constant à chaque course." },
      { title: "Transparence", description: "Des prix fixes clairs, sans frais cachés." },
      { title: "Sécurité", description: "Des chauffeurs vérifiés et des trajets traçables." },
      { title: "Proximité", description: "Un service bilingue ancré dans les communautés du Québec." },
    ],
    registeredTitle: "Entreprise enregistrée",
    registeredText:
      "LogicMoov est une entreprise enregistrée provincialement au Québec, Canada — NEQ 2282359860.",
    detailsTitle: "LogicMoov en bref",
    details: [
      { label: "Numéro d'entreprise du Québec (NEQ)", value: "2282359860" },
      { label: "En activité depuis", value: "2026" },
      { label: "Taille de la flotte", value: "Plus de 30 véhicules" },
      { label: "Régions desservies", value: "Montréal et les environs" },
      {
        label: "Aéroport desservi",
        value: "Aéroport international Montréal-Trudeau (YUL)",
      },
    ],
    vehicleTypesTitle: "Accessibilité et types de véhicules",
    vehicleTypesSubtitle:
      "Une flotte variée pour répondre à tous les besoins de déplacement.",
    vehicleTypes: [
      {
        name: "Berlines",
        description:
          "Voitures standard à 4 portes pouvant accueillir jusqu'à 4 passagers pour les trajets réguliers.",
      },
      {
        name: "Fourgonnettes",
        description:
          "Véhicules multiplaces plus spacieux, conçus pour les familles ou petits groupes avec bagages supplémentaires.",
      },
      {
        name: "Taxis adaptés",
        description:
          "Véhicules spécialement équipés de rampes ou de plateformes élévatrices pour les voyageurs à mobilité réduite ou en fauteuil roulant.",
      },
    ],
  },
  contact: {
    title: "Contactez-nous",
    subtitle: "Une question ou une réservation spéciale ? Nous sommes là pour vous.",
    phoneTitle: "Téléphone",
    phone: "+514-266-4708",
    emailTitle: "Courriel",
    email: "info@logicmoov.ca",
    hoursTitle: "Heures",
    hours: "24 heures / 7 jours",
    addressTitle: "Bureau",
    address: "1000 Rue de la Gauchetière O, Montréal, QC",
    formName: "Nom",
    formEmail: "Courriel",
    formMessage: "Message",
    formSubmit: "Envoyer le message",
    formSuccess: "Merci ! Votre message a été envoyé.",
  },
  cancellationPolicy: {
    title: "Politique d'annulation",
    lead:
      "Nous comprenons que les plans peuvent changer. Voici comment fonctionnent les annulations et modifications pour les réservations LogicMoov.",
    items: [
      {
        title: "Annulation gratuite",
        description:
          "Vous pouvez annuler gratuitement jusqu'à 2 heures avant l'heure de prise en charge prévue.",
      },
      {
        title: "Annulation tardive",
        description:
          "Toute annulation effectuée moins de 2 heures avant la prise en charge peut entraîner des frais correspondant à une partie du tarif estimé.",
      },
      {
        title: "Non-présentation",
        description:
          "Si le chauffeur se présente à l'heure et au lieu convenus et que le passager reste introuvable après 15 minutes d'attente (30 minutes pour les transferts aéroport), la course est considérée comme non honorée et les frais applicables sont facturés.",
      },
      {
        title: "Modifications de réservation",
        description:
          "Vous pouvez modifier l'heure, le lieu ou le véhicule de votre réservation gratuitement, sous réserve de disponibilité, en nous contactant avant l'heure prévue.",
      },
      {
        title: "Annulation par LogicMoov",
        description:
          "Dans le cas rare où une course devrait être annulée de notre côté, vous serez averti dans les plus brefs délais et intégralement remboursé si un paiement a déjà été effectué.",
      },
      {
        title: "Comment annuler",
        description:
          "Pour annuler ou modifier une réservation, contactez-nous au +514-266-4708 ou à info@logicmoov.ca.",
      },
    ],
  },
  footer: {
    tagline: "Transport de taxi moderne, fiable et bilingue partout au Québec.",
    company: "Entreprise",
    servicesCol: "Services",
    legal: "Légal",
    privacy: "Confidentialité",
    terms: "Conditions d'utilisation",
    accessibility: "Accessibilité",
    cancellationPolicy: "Politique d'annulation",
    rights: "Tous droits réservés. NEQ 2282359860.",
    langLabel: "Langue",
  },
  chat: {
    launcher: "Aide",
    title: "Assistance LogicMoov",
    subtitleBot: "Assistant virtuel · réponses instantanées",
    subtitleWaiting: "Mise en relation avec un agent…",
    subtitleAgent: "Vous discutez avec un agent",
    subtitleResolved: "Conversation terminée",
    greeting:
      "Bonjour ! Comment puis-je vous aider aujourd'hui ? Posez-moi une question sur les prix, la réservation ou nos services.",
    placeholder: "Écrivez votre message…",
    send: "Envoyer",
    talkToHuman: "Parler à un agent",
    startError: "Impossible de démarrer la conversation. Réessayez plus tard.",
    poweredBy: "Assistant IA + agents en direct",
    you: "Vous",
    bot: "Assistant",
    agent: "Agent",
    system: "Système",
    newChat: "Nouvelle conversation",
    offline: "Service de clavardage indisponible.",
    agentsOffline:
      "Nos agents ne sont pas joignables via le clavardage pour le moment. Appelez-nous au +1 (514) 555-0123 ou écrivez à info@logicmoov.ca et nous vous répondrons rapidement.",
  },
  common: {
    loading: "Chargement…",
  },
};

const en: Dictionary = {
  brand: {
    name: "LogicMoov",
    tagline: "Modern taxi transportation in Quebec",
  },
  nav: {
    home: "Home",
    howItWorks: "How it works",
    fleet: "Our fleet",
    services: "Services",
    coverage: "Coverage",
    about: "About",
    contact: "Contact",
    book: "Book",
    callUs: "Call us",
    menu: "Menu",
  },
  hero: {
    badge: "Available 24/7 across Quebec",
    title: "Your ride, made simple",
    titleAccent: "across Quebec",
    subtitle:
      "Book a reliable taxi in seconds. Fixed prices, professional drivers and real-time tracking — from Montreal to Quebec City and beyond.",
    ctaPrimary: "Book a ride",
    ctaSecondary: "See how it works",
    trust: "Trusted by thousands of Quebec travellers",
  },
  stats: {
    rides: "Rides completed",
    drivers: "Partner drivers",
    cities: "Cities served",
    rating: "Average rating",
  },
  quickBook: {
    title: "Estimate your ride",
    pickup: "Pickup",
    pickupPlaceholder: "Pickup address",
    dropoff: "Destination",
    dropoffPlaceholder: "Drop-off address",
    when: "When",
    now: "Now",
    schedule: "Schedule",
    submit: "Get an estimate",
    estimate: "Estimated price",
    note: "Indicative estimate. Final price is confirmed before departure.",
  },
  services: {
    title: "Services for every trip",
    subtitle:
      "Whether it's the airport, work or a night out, we have the right solution.",
    items: [
      {
        title: "Airport transfers",
        description:
          "Trips to and from YUL and YQB with flight tracking and meet-and-greet arrival.",
      },
      {
        title: "Corporate transport",
        description:
          "Business accounts, centralized billing and discreet drivers for your teams.",
      },
      {
        title: "City rides",
        description:
          "Fast urban trips at a fixed price — no surprises, no surge pricing.",
      },
      {
        title: "Long distance",
        description:
          "Comfortable intercity travel between Montreal, Quebec City, Laval, Gatineau and more.",
      },
      {
        title: "Events & groups",
        description:
          "Vans and multiple vehicles for weddings, conferences and group travel.",
      },
      {
        title: "Medical transport",
        description:
          "Punctual rides to medical appointments with caring, on-time drivers.",
      },
    ],
  },
  howItWorks: {
    title: "Book in three simple steps",
    subtitle: "No app required — book directly online.",
    steps: [
      {
        title: "Enter your trip",
        description:
          "Add your pickup point, destination and preferred time.",
      },
      {
        title: "Choose your vehicle",
        description:
          "Pick the category that suits you and see the fixed price up front.",
      },
      {
        title: "Track and travel",
        description:
          "Get your confirmation, track your driver in real time and ride with peace of mind.",
      },
    ],
  },
  fleet: {
    title: "A fleet for every need",
    subtitle: "Well-maintained, clean and comfortable vehicles.",
    perTrip: "from",
    seats: "seats",
    book: "Select",
    items: [
      {
        name: "Sedan",
        description: "Ideal for 1 to 3 passengers with standard luggage.",
        seats: 4,
        price: "$25",
      },
      {
        name: "SUV",
        description: "More room for luggage and comfort.",
        seats: 5,
        price: "$39",
      },
      {
        name: "Van",
        description: "Perfect for groups and larger families.",
        seats: 7,
        price: "$59",
      },
      {
        name: "Luxury",
        description: "Premium sedan for your business travel.",
        seats: 3,
        price: "$79",
      },
    ],
  },
  features: {
    title: "Why choose LogicMoov",
    subtitle:
      "A modern platform built for reliability and peace of mind.",
    items: [
      {
        title: "Guaranteed fixed prices",
        description:
          "The price you see is the price you pay. No surge pricing, no bad surprises.",
      },
      {
        title: "Available 24/7",
        description: "Book any time, every day of the year.",
      },
      {
        title: "Real-time tracking",
        description:
          "Follow your driver on the map and share your trip with loved ones.",
      },
      {
        title: "Verified drivers",
        description:
          "Trained, courteous and vetted professionals for your safety.",
      },
      {
        title: "Flight tracking",
        description:
          "Our drivers adjust pickup times based on your real flight status.",
      },
      {
        title: "Flexible payment",
        description:
          "Pay by card, online or with a corporate account — your choice.",
      },
    ],
  },
  coverage: {
    title: "We cover all of Quebec",
    subtitle:
      "Taxi service available in the province's major cities and airports.",
    cities: [
      "Montreal",
      "Quebec City",
      "Laval",
      "Gatineau",
      "Sherbrooke",
      "Trois-Rivières",
      "Longueuil",
      "YUL Airport",
      "YQB Airport",
    ],
    cta: "Don't see your city?",
    ctaLink: "Contact us",
  },
  testimonials: {
    title: "What our customers say",
    items: [
      {
        quote:
          "Super easy booking and the driver was on time for my early morning flight. Highly recommend!",
        author: "Marie-Claude L.",
        role: "Montreal",
      },
      {
        quote:
          "Fixed price announced up front, no surprises. Perfect for my business travel.",
        author: "Jean-François T.",
        role: "Quebec City",
      },
      {
        quote:
          "Real-time tracking gave me peace of mind. Clean, punctual and professional service.",
        author: "Sophie R.",
        role: "Laval",
      },
    ],
  },
  cta: {
    title: "Ready to book your next ride?",
    subtitle:
      "Get a fixed price in seconds and travel with peace of mind.",
    primary: "Book now",
    secondary: "Call us",
  },
  booking: {
    title: "Book your ride",
    subtitle: "Fixed price confirmed before departure. No app required.",
    step: "Step",
    of: "of",
    steps: {
      trip: "Trip",
      vehicle: "Vehicle",
      details: "Details",
      confirm: "Confirmation",
    },
    tripType: "Trip type",
    oneWay: "One way",
    roundTrip: "Round trip",
    pickup: "Pickup",
    pickupPlaceholder: "e.g. 1000 De la Gauchetière St, Montreal",
    dropoff: "Destination",
    dropoffPlaceholder: "e.g. Montreal-Trudeau Airport (YUL)",
    date: "Date",
    time: "Time",
    passengers: "Passengers",
    luggage: "Luggage",
    chooseVehicle: "Choose your vehicle",
    estimatedPrice: "Estimated price",
    fullName: "Full name",
    fullNamePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    phone: "Phone",
    phonePlaceholder: "(514) 555-0123",
    notes: "Notes (optional)",
    notesPlaceholder: "Flight number, special instructions…",
    back: "Back",
    next: "Continue payment",
    confirm: "Confirm booking",
    summary: "Booking summary",
    successTitle: "Booking confirmed!",
    successMessage:
      "Thank you! Your request has been received. A driver will be assigned and you'll get an email confirmation.",
    reference: "Reference number",
    newBooking: "New booking",
    required: "This field is required",
    invalidEmail: "Invalid email",
    submitting: "Processing…",
    errorTitle: "Booking failed",
    errorGeneric:
      "Something went wrong while booking. Please try again.",
    errorNetwork:
      "Could not reach the booking service. Make sure the API is running, then try again.",
    retry: "Try again",
    paid: "Paid",
    demoNote:
      "This is a demo. No real payment is processed and no driver is actually dispatched.",
  },
  about: {
    title: "About LogicMoov",
    lead: "We're modernizing taxi transportation in Quebec with reliable technology and human service.",
    body: [
      "LogicMoov was born from a simple idea: make taxi travel transparent, punctual and accessible everywhere in the province. No more unpredictable fares or uncertain waiting.",
      "Our platform connects travellers to a network of verified professional drivers, with fixed prices announced up front and real-time tracking of every ride.",
      "From airport transfers to business travel, our mission is to get you to your destination with confidence — in French and in English.",
    ],
    valuesTitle: "Our values",
    values: [
      { title: "Reliability", description: "Punctuality and consistent service on every ride." },
      { title: "Transparency", description: "Clear fixed prices with no hidden fees." },
      { title: "Safety", description: "Verified drivers and traceable trips." },
      { title: "Community", description: "Bilingual service rooted in Quebec communities." },
    ],
    registeredTitle: "Registered business",
    registeredText:
      "LogicMoov is a provincially registered business in Québec, Canada — NEQ 2282359860.",
    detailsTitle: "LogicMoov at a glance",
    details: [
      { label: "Québec business number (NEQ)", value: "2282359860" },
      { label: "In business since", value: "2026" },
      { label: "Fleet size", value: "30+ vehicles" },
      { label: "Regions served", value: "Montreal and surrounding area" },
      {
        label: "Airport served",
        value: "Montréal Trudeau International Airport",
      },
    ],
    vehicleTypesTitle: "Accessibility & Vehicle Types",
    vehicleTypesSubtitle: "A varied fleet to match every travel need.",
    vehicleTypes: [
      {
        name: "Sedans",
        description:
          "Standard 4-door cars that fit up to 4 passengers for regular trips.",
      },
      {
        name: "Minivans",
        description:
          "Larger multi-passenger vehicles designed for families or small groups with extra luggage.",
      },
      {
        name: "Adapted Taxis",
        description:
          "Specially equipped vehicles with ramps or lifts for travelers with limited mobility or wheelchair users.",
      },
    ],
  },
  contact: {
    title: "Contact us",
    subtitle: "A question or a special booking? We're here for you.",
    phoneTitle: "Phone",
    phone: "+514-266-4708",
    emailTitle: "Email",
    email: "info@logicmoov.ca",
    hoursTitle: "Hours",
    hours: "24 hours / 7 days",
    addressTitle: "Office",
    address: "1000 De la Gauchetière St W, Montreal, QC",
    formName: "Name",
    formEmail: "Email",
    formMessage: "Message",
    formSubmit: "Send message",
    formSuccess: "Thank you! Your message has been sent.",
  },
  cancellationPolicy: {
    title: "Cancellation Policy",
    lead:
      "We understand plans can change. Here's how cancellations and changes work for LogicMoov bookings.",
    items: [
      {
        title: "Free cancellation",
        description:
          "You can cancel free of charge up to 2 hours before the scheduled pickup time.",
      },
      {
        title: "Late cancellation",
        description:
          "Cancellations made less than 2 hours before pickup may incur a fee based on a portion of the estimated fare.",
      },
      {
        title: "No-shows",
        description:
          "If the driver arrives at the agreed time and location and the passenger cannot be reached after 15 minutes of waiting (30 minutes for airport transfers), the ride is considered a no-show and applicable fees will be charged.",
      },
      {
        title: "Booking changes",
        description:
          "You can change the time, location or vehicle for your booking free of charge, subject to availability, by contacting us before the scheduled time.",
      },
      {
        title: "Cancellation by LogicMoov",
        description:
          "In the rare case a ride needs to be cancelled on our end, you'll be notified as soon as possible and fully refunded if a payment has already been made.",
      },
      {
        title: "How to cancel",
        description:
          "To cancel or change a booking, contact us at +514-266-4708 or info@logicmoov.ca.",
      },
    ],
  },
  footer: {
    tagline: "Modern, reliable, bilingual taxi transportation across Quebec.",
    company: "Company",
    servicesCol: "Services",
    legal: "Legal",
    privacy: "Privacy",
    terms: "Terms of use",
    accessibility: "Accessibility",
    cancellationPolicy: "Cancellation policy",
    rights: "All rights reserved. NEQ 2282359860.",
    langLabel: "Language",
  },
  chat: {
    launcher: "Help",
    title: "LogicMoov Support",
    subtitleBot: "Virtual assistant · instant answers",
    subtitleWaiting: "Connecting you to an agent…",
    subtitleAgent: "You're chatting with an agent",
    subtitleResolved: "Conversation ended",
    greeting:
      "Hi! How can I help you today? Ask me about pricing, booking or our services.",
    placeholder: "Type your message…",
    send: "Send",
    talkToHuman: "Talk to an agent",
    startError: "Couldn't start the conversation. Please try again later.",
    poweredBy: "AI assistant + live agents",
    you: "You",
    bot: "Assistant",
    agent: "Agent",
    system: "System",
    newChat: "New chat",
    offline: "Chat service unavailable.",
    agentsOffline:
      "Our agents aren't reachable via chat right now. Call us at +1 (514) 555-0123 or email info@logicmoov.ca and we'll get back to you quickly.",
  },
  common: {
    loading: "Loading…",
  },
};

const dictionaries: Record<Locale, Dictionary> = { fr, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
