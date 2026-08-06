import type { Locale } from "./config";

export type Dictionary = typeof fr;

const fr = {
  brand: {
    name: "LogicMoov",
    tagline: "Transport de taxi moderne au Qu├⌐bec",
  },
  nav: {
    home: "Accueil",
    howItWorks: "Comment ├ºa marche",
    fleet: "Notre flotte",
    services: "Services",
    coverage: "Couverture",
    about: "├Ç propos",
    contact: "Contact",
    book: "R├⌐server",
    callUs: "Appelez-nous",
    menu: "Menu",
  },
  hero: {
    badge: "Disponible 24/7 partout au Qu├⌐bec",
    title: "Votre course, simplifi├⌐e",
    titleAccent: "partout au Qu├⌐bec",
    subtitle:
      "R├⌐servez un taxi fiable en quelques secondes. Prix fixes, chauffeurs professionnels et suivi en temps r├⌐el ΓÇö de Montr├⌐al ├á Qu├⌐bec et au-del├á.",
    ctaPrimary: "R├⌐server une course",
    ctaSecondary: "Voir comment ├ºa marche",
    trust: "La confiance de milliers de voyageurs qu├⌐b├⌐cois",
  },
  stats: {
    rides: "Courses compl├⌐t├⌐es",
    drivers: "Chauffeurs partenaires",
    cities: "Villes desservies",
    rating: "Note moyenne",
  },
  quickBook: {
    title: "Estimez votre course",
    pickup: "Point de d├⌐part",
    pickupPlaceholder: "Adresse de d├⌐part",
    dropoff: "Destination",
    dropoffPlaceholder: "Adresse d'arriv├⌐e",
    when: "Quand",
    now: "Maintenant",
    schedule: "Planifier",
    submit: "Obtenir une estimation",
    estimate: "Prix estim├⌐",
    note: "Estimation indicative. Le prix final est confirm├⌐ avant le d├⌐part.",
  },
  services: {
    title: "Des services pour chaque trajet",
    subtitle:
      "Que ce soit pour l'a├⌐roport, le travail ou une sortie, nous avons une solution adapt├⌐e.",
    items: [
      {
        title: "Transferts a├⌐roport",
        description:
          "Trajets vers et depuis YUL et YQB avec suivi des vols et accueil ├á l'arriv├⌐e.",
      },
      {
        title: "Transport corporatif",
        description:
          "Comptes entreprise, facturation centralis├⌐e et chauffeurs discrets pour vos ├⌐quipes.",
      },
      {
        title: "Courses en ville",
        description:
          "D├⌐placements urbains rapides ├á prix fixe, sans surprise ni tarification dynamique.",
      },
      {
        title: "Longue distance",
        description:
          "Voyages intervilles confortables entre Montr├⌐al, Qu├⌐bec, Laval, Gatineau et plus.",
      },
      {
        title: "├ëv├⌐nements & groupes",
        description:
          "Vans et v├⌐hicules multiples pour mariages, congr├¿s et d├⌐placements de groupe.",
      },
      {
        title: "Transport m├⌐dical",
        description:
          "Rendez-vous m├⌐dicaux ponctuels avec chauffeurs attentionn├⌐s et ponctuels.",
      },
    ],
  },
  howItWorks: {
    title: "R├⌐servez en trois ├⌐tapes simples",
    subtitle: "Aucune application requise ΓÇö r├⌐servez directement en ligne.",
    steps: [
      {
        title: "Indiquez votre trajet",
        description:
          "Entrez votre point de d├⌐part, votre destination et l'heure souhait├⌐e.",
      },
      {
        title: "Choisissez votre v├⌐hicule",
        description:
          "S├⌐lectionnez la cat├⌐gorie qui vous convient et voyez le prix fixe ├á l'avance.",
      },
      {
        title: "Suivez et voyagez",
        description:
          "Recevez la confirmation, suivez votre chauffeur en temps r├⌐el et voyagez sereinement.",
      },
    ],
  },
  fleet: {
    title: "Une flotte pour chaque besoin",
    subtitle: "Des v├⌐hicules entretenus, propres et confortables.",
    perTrip: "├á partir de",
    seats: "places",
    book: "Choisir",
    items: [
      {
        name: "Berline",
        description: "Id├⌐ale pour 1 ├á 3 passagers avec bagages standards.",
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
        description: "VUS premium pour vos d├⌐placements d'affaires.",
        seats: 8,
        price: "79 $",
      },
    ],
  },
  features: {
    title: "Pourquoi choisir LogicMoov",
    subtitle:
      "Une plateforme moderne con├ºue pour la fiabilit├⌐ et la tranquillit├⌐ d'esprit.",
    items: [
      {
        title: "Prix fixes garantis",
        description:
          "Le prix affich├⌐ est le prix pay├⌐. Pas de tarification dynamique ni de mauvaises surprises.",
      },
      {
        title: "Disponible 24/7",
        description: "R├⌐servez ├á toute heure, tous les jours de l'ann├⌐e.",
      },
      {
        title: "Suivi en temps r├⌐el",
        description:
          "Suivez votre chauffeur sur la carte et partagez votre trajet avec vos proches.",
      },
      {
        title: "Chauffeurs v├⌐rifi├⌐s",
        description:
          "Des professionnels form├⌐s, courtois et v├⌐rifi├⌐s pour votre s├⌐curit├⌐.",
      },
      {
        title: "Suivi des vols",
        description:
          "Nos chauffeurs ajustent l'heure de prise en charge selon votre vol r├⌐el.",
      },
      {
        title: "Paiement flexible",
        description:
          "Payez par carte, en ligne ou avec un compte corporatif ΓÇö au choix.",
      },
    ],
  },
  coverage: {
    title: "Nous couvrons tout le Qu├⌐bec",
    subtitle:
      "Service de taxi disponible dans les principales villes et a├⌐roports de la province.",
    cities: [
      "Montr├⌐al",
      "Ville de Qu├⌐bec",
      "Laval",
      "Gatineau",
      "Sherbrooke",
      "Trois-Rivi├¿res",
      "Longueuil",
      "A├⌐roport YUL",
      "A├⌐roport YQB",
    ],
    cta: "Votre ville n'est pas list├⌐e ?",
    ctaLink: "Contactez-nous",
  },
  testimonials: {
    title: "Ce que disent nos clients",
    items: [
      {
        quote:
          "R├⌐servation ultra simple et chauffeur ├á l'heure pour mon vol t├┤t le matin. Je recommande !",
        author: "Marie-Claude L.",
        role: "Montr├⌐al",
      },
      {
        quote:
          "Prix fixe annonc├⌐ ├á l'avance, aucune surprise. Parfait pour mes d├⌐placements d'affaires.",
        author: "Jean-Fran├ºois T.",
        role: "Ville de Qu├⌐bec",
      },
      {
        quote:
          "Le suivi en temps r├⌐el m'a rassur├⌐e. Service propre, ponctuel et professionnel.",
        author: "Sophie R.",
        role: "Laval",
      },
    ],
  },
  cta: {
    title: "Pr├¬t ├á r├⌐server votre prochaine course ?",
    subtitle:
      "Obtenez un prix fixe en quelques secondes et voyagez l'esprit tranquille.",
    primary: "R├⌐server maintenant",
    secondary: "Nous appeler",
  },
  booking: {
    title: "R├⌐servez votre course",
    subtitle: "Prix fixe confirm├⌐ avant le d├⌐part. Aucune application requise.",
    step: "├ëtape",
    of: "de",
    steps: {
      trip: "Trajet",
      passengers: "Passagers",
      vehicle: "V├⌐hicule",
      details: "Coordonn├⌐es",
      confirm: "Confirmation",
    },
    tripType: "Type de trajet",
    oneWay: "Aller simple",
    roundTrip: "Aller-retour",
    pickup: "Point de d├⌐part",
    pickupPlaceholder: "Ex. 1000 Rue de la Gaucheti├¿re, Montr├⌐al",
    dropoff: "Destination",
    dropoffPlaceholder: "Ex. A├⌐roport Montr├⌐al-Trudeau (YUL)",
    date: "Date",
    time: "Heure",
    passengers: "Passagers",
    adults: "Adultes",
    adultsAge: "12+ ans",
    children: "Enfants",
    childrenAge: "2-11 ans",
    infants: "Bebes",
    infantsAge: "Moins de 2 ans",
    childSeatRequirements: "Sieges pour enfants",
    infantSeat: "Siege bebe (0-2 ans)",
    childSeat: "Siege enfant (2-5 ans)",
    boosterSeat: "Siege rehausseur (5+ ans)",
    quantity: "Quantite",
    recommended: "Recommande",
    locationSearchUnavailable:
      "Suggestions d'adresse indisponibles. Verifiez la cle Google Maps.",
    luggage: "Bagages",
    chooseVehicle: "Choisissez votre v├⌐hicule",
    estimatedPrice: "Prix estim├⌐",
    fullName: "Nom complet",
    fullNamePlaceholder: "Votre nom",
    email: "Courriel",
    emailPlaceholder: "vous@exemple.com",
    phone: "T├⌐l├⌐phone",
    phonePlaceholder: "(514) 555-0123",
    notes: "Notes (optionnel)",
    notesPlaceholder: "Num├⌐ro de vol, instructions sp├⌐cialesΓÇª",
    back: "Retour",
    next: "Continuer le paiement",
    confirm: "Confirmer la r├⌐servation",
    summary: "R├⌐sum├⌐ de la r├⌐servation",
    successTitle: "R├⌐servation confirm├⌐e !",
    successMessage:
      "Merci ! Votre demande a ├⌐t├⌐ re├ºue. Un chauffeur vous sera assign├⌐ et vous recevrez une confirmation par courriel.",
    reference: "Num├⌐ro de r├⌐f├⌐rence",
    newBooking: "Nouvelle r├⌐servation",
    required: "Ce champ est requis",
    invalidEmail: "Courriel invalide",
    submitting: "Traitement en coursΓÇª",
    errorTitle: "La r├⌐servation a ├⌐chou├⌐",
    errorGeneric:
      "Une erreur est survenue lors de la r├⌐servation. Veuillez r├⌐essayer.",
    errorNetwork:
      "Impossible de joindre le service de r├⌐servation. Assurez-vous que l'API est d├⌐marr├⌐e, puis r├⌐essayez.",
    retry: "R├⌐essayer",
    paid: "Pay├⌐",
    demoNote:
      "Ceci est une d├⌐monstration. Aucun paiement r├⌐el n'est trait├⌐ et aucun chauffeur n'est r├⌐ellement envoy├⌐.",
  },
  about: {
    title: "├Ç propos de LogicMoov",
    lead: "Nous modernisons le transport de taxi au Qu├⌐bec avec une technologie fiable et un service humain.",
    body: [
      "LogicMoov est n├⌐ d'une id├⌐e simple : rendre le transport en taxi transparent, ponctuel et accessible partout dans la province. Fini les tarifs impr├⌐visibles et l'attente incertaine.",
      "Notre plateforme relie les voyageurs ├á un r├⌐seau de chauffeurs professionnels v├⌐rifi├⌐s, avec des prix fixes annonc├⌐s ├á l'avance et un suivi en temps r├⌐el de chaque course.",
      "Des transferts a├⌐roport aux d├⌐placements d'affaires, notre mission est de vous amener ├á destination en toute confiance, en fran├ºais comme en anglais.",
    ],
    valuesTitle: "Nos valeurs",
    foundersTitle: "Rencontrez les fondateurs",
    foundersSubtitle:
      "D├⌐couvrez l'├⌐quipe fondatrice derri├¿re LogicMoov et notre vision d'un transport plus fiable au Qu├⌐bec.",
    values: [
      { title: "Fiabilit├⌐", description: "Ponctualit├⌐ et service constant ├á chaque course." },
      { title: "Transparence", description: "Des prix fixes clairs, sans frais cach├⌐s." },
      { title: "S├⌐curit├⌐", description: "Des chauffeurs v├⌐rifi├⌐s et des trajets tra├ºables." },
      { title: "Proximit├⌐", description: "Un service bilingue ancr├⌐ dans les communaut├⌐s du Qu├⌐bec." },
    ],
    registeredTitle: "Entreprise enregistr├⌐e",
    registeredText:
      "LogicMoov est une entreprise enregistr├⌐e provincialement au Qu├⌐bec, Canada ΓÇö NEQ 2282359860.",
    detailsTitle: "LogicMoov en bref",
    details: [
      { label: "Num├⌐ro d'entreprise du Qu├⌐bec (NEQ)", value: "2282359860" },
      { label: "En activit├⌐ depuis", value: "2026" },
      { label: "Taille de la flotte", value: "Plus de 30 v├⌐hicules" },
      { label: "R├⌐gions desservies", value: "Montr├⌐al et les environs" },
      {
        label: "A├⌐roport desservi",
        value: "A├⌐roport international Montr├⌐al-Trudeau (YUL)",
      },
    ],
    vehicleTypesTitle: "Accessibilit├⌐ et types de v├⌐hicules",
    vehicleTypesSubtitle:
      "Une flotte vari├⌐e pour r├⌐pondre ├á tous les besoins de d├⌐placement.",
    vehicleTypes: [
      {
        name: "Berlines",
        description:
          "Voitures standard ├á 4 portes pouvant accueillir jusqu'├á 4 passagers pour les trajets r├⌐guliers.",
      },
      {
        name: "Fourgonnettes",
        description:
          "V├⌐hicules multiplaces plus spacieux, con├ºus pour les familles ou petits groupes avec bagages suppl├⌐mentaires.",
      },
      {
        name: "Taxis adapt├⌐s",
        description:
          "V├⌐hicules sp├⌐cialement ├⌐quip├⌐s de rampes ou de plateformes ├⌐l├⌐vatrices pour les voyageurs ├á mobilit├⌐ r├⌐duite ou en fauteuil roulant.",
      },
    ],
  },
  contact: {
    title: "Contactez-nous",
    subtitle: "Une question ou une r├⌐servation sp├⌐ciale ? Nous sommes l├á pour vous.",
    phoneTitle: "T├⌐l├⌐phone",
    phone: "+514-266-4708",
    emailTitle: "Courriel",
    email: "info@logicmoov.ca",
    hoursTitle: "Heures",
    hours: "24 heures / 7 jours",
    addressTitle: "Bureau",
    address: "1000 Rue de la Gaucheti├¿re O, Montr├⌐al, QC",
    formName: "Nom",
    formEmail: "Courriel",
    formMessage: "Message",
    formSubmit: "Envoyer le message",
    formSuccess: "Merci ! Votre message a ├⌐t├⌐ envoy├⌐.",
  },
  cancellationPolicy: {
    title: "Politique d'annulation",
    lead:
      "Politique d'annulation des transferts aéroport LogicMoov. Nous comprenons que les plans peuvent changer. Voici comment fonctionnent les annulations pour les réservations de transfert aéroport LogicMoov.",
    items: [
      {
        title: "1. Annulation gratuite",
        description:
          "Les clients peuvent annuler leur réservation sans frais jusqu'à 24 heures avant l'heure prévue de prise en charge.",
      },
      {
        title: "2. Frais d'annulation",
        description:
          "Plus de 24 heures avant la prise en charge : aucuns frais d'annulation (remboursement de 100 %). • Entre 24 heures et 2 heures avant la prise en charge : 50 % du montant de la réservation seront facturés. • Moins de 2 heures avant la prise en charge : 100 % du montant de la réservation seront facturés.",
      },
      {
        title: "3. Politique en cas de non-présentation (No-Show)",
        description:
          "Une réservation sera considérée comme une absence du passager (No-Show) si le passager ne se présente pas au lieu de prise en charge convenu pendant le délai d'attente gratuit, ne peut pas être joint au numéro de téléphone fourni lors de la réservation, ou quitte le lieu de prise en charge sans en informer LogicMoov. Les réservations en cas de non-présentation ne sont pas remboursables.",
      },
      {
        title: "4. Temps d'attente gratuit",
        description:
          "Prises en charge à l'aéroport : Jusqu'à 60 minutes d'attente gratuite après l'atterrissage du vol. • Hôtels, résidences ou autres lieux : Jusqu'à 15 minutes d'attente gratuite après l'heure prévue de prise en charge. Un temps d'attente supplémentaire peut être facturé selon le tarif d'attente applicable.",
      },
      {
        title: "5. Retards de vol",
        description:
          "Pour les prises en charge à l'aéroport, LogicMoov surveille les arrivées des vols. En cas de retard, l'heure de prise en charge du chauffeur sera ajustée dans la mesure du possible. Aucun frais supplémentaire ne sera appliqué pour le retard du vol lui-même.",
      },
      {
        title: "6. Annulation de vol",
        description:
          "Si un vol est annulé, les clients doivent informer LogicMoov dès que possible. Si l'annulation intervient plus de 24 heures avant l'heure prévue de prise en charge, un remboursement complet sera effectué. Dans le cas contraire, la politique d'annulation standard s'applique.",
      },
      {
        title: "7. Retard du chauffeur",
        description:
          "Si LogicMoov ne peut pas fournir le service réservé en raison de problèmes opérationnels, le client recevra au choix un remboursement complet ou un véhicule de remplacement sans frais supplémentaires, sous réserve de disponibilité.",
      },
      {
        title: "8. Modification de réservation",
        description:
          "Les modifications concernant l'heure de prise en charge, le numéro de vol, la destination ou les informations des passagers peuvent être demandées jusqu'à 24 heures avant la prise en charge, sous réserve de disponibilité. Des frais supplémentaires peuvent s'appliquer si la modification entraîne un changement important du trajet ou du service.",
      },
      {
        title: "9. Traitement des remboursements",
        description:
          "Les remboursements approuvés seront effectués sur le mode de paiement original dans un délai de 5 à 10 jours ouvrables, selon le fournisseur de paiement utilisé.",
      },
      {
        title: "10. Force majeure",
        description:
          "LogicMoov n'est pas responsable des retards ou interruptions de service causés par des circonstances indépendantes de sa volonté, notamment les conditions météorologiques extrêmes, fermetures de routes, catastrophes naturelles, mesures gouvernementales ou incidents majeurs de circulation. Les demandes de remboursement liées à ces situations seront évaluées au cas par cas.",
      },
      {
        title: "11. Heures d'exploitation",
        description: "24 heures / 7 jours par semaine (24/7/365).",
      },
      {
        title: "12. Délai de préavis minimum (heures)",
        description:
          "Les clients peuvent réserver un transfert aéroport jusqu'à 2 heures avant l'heure prévue de prise en charge.",
      },
      {
        title: "13. Instructions de rendez-vous à l'aéroport",
        description:
          "Après avoir récupéré vos bagages, veuillez vous rendre à la zone de prise en charge désignée pour votre terminal.\n\n- Votre chauffeur suivra votre vol et ajustera l'heure de prise en charge si votre vol arrive en avance ou en retard.\n- Le temps d'attente gratuit de 60 minutes commence à partir de l'heure réelle d'atterrissage du vol.\n- Votre chauffeur vous contactera par téléphone, SMS ou WhatsApp en utilisant les coordonnées fournies lors de la réservation.\n- Veuillez garder votre téléphone mobile allumé après l'atterrissage.\n- Si vous ne parvenez pas à localiser votre chauffeur, contactez immédiatement le service client LogicMoov en utilisant le numéro de téléphone indiqué dans votre confirmation de réservation.\n- Pour les prises en charge à l'aéroport nécessitant un service d'accueil personnalisé, votre chauffeur vous attendra dans le hall des arrivées avec une pancarte affichant le nom du passager principal (lorsque ce service a été sélectionné).\n- Si vous rencontrez des retards liés à l'immigration ou à la récupération des bagages, veuillez en informer LogicMoov dès que possible afin de nous aider à coordonner votre prise en charge.\n- Un temps d'attente supplémentaire au-delà de la période gratuite peut entraîner des frais additionnels.\n\nMerci d'avoir choisi LogicMoov. Nous avons hâte de vous offrir un transfert aéroport sûr, fiable et confortable.",
      },
    ],
    fareDetails: {
      title: "Détails des tarifs - Trajet aller simple",
      destinationZone: "Zone de destination",
      distance: "Distance",
      suggestedFixedFare: "Tarif fixe suggéré",
      rows: [
        { destination: "Centre-ville", distance: "20 km", fare: "$49.45 (tarif réglementé)" },
        { destination: "Vieux-Montréal", distance: "22 km", fare: "$49.45" },
        { destination: "Plateau", distance: "23 km", fare: "$55" },
        { destination: "Laval", distance: "28 km", fare: "$80" },
        { destination: "Longueuil", distance: "30 km", fare: "$85" },
        { destination: "Brossard", distance: "35 km", fare: "$95" },
        { destination: "Vaudreuil", distance: "42 km", fare: "$105" },
        { destination: "Mirabel", distance: "55 km", fare: "$125" },
      ],
    },
  },
  footer: {
    tagline: "Transport de taxi moderne, fiable et bilingue partout au Qu├⌐bec.",
    company: "Entreprise",
    meetFounders: "Rencontrez les fondateurs",
    servicesCol: "Services",
    legal: "L├⌐gal",
    privacy: "Confidentialit├⌐",
    terms: "Conditions d'utilisation",
    accessibility: "Accessibilit├⌐",
    cancellationPolicy: "Politique d'annulation",
    rights: "Tous droits r├⌐serv├⌐s. NEQ 2282359860.",
    langLabel: "Langue",
  },
  chat: {
    launcher: "Aide",
    title: "Assistance LogicMoov",
    subtitleBot: "Assistant virtuel ┬╖ r├⌐ponses instantan├⌐es",
    subtitleWaiting: "Mise en relation avec un agentΓÇª",
    subtitleAgent: "Vous discutez avec un agent",
    subtitleResolved: "Conversation termin├⌐e",
    greeting:
      "Bonjour ! Comment puis-je vous aider aujourd'hui ? Posez-moi une question sur les prix, la r├⌐servation ou nos services.",
    placeholder: "├ëcrivez votre messageΓÇª",
    send: "Envoyer",
    talkToHuman: "Parler ├á un agent",
    startError: "Impossible de d├⌐marrer la conversation. R├⌐essayez plus tard.",
    poweredBy: "Assistant IA + agents en direct",
    you: "Vous",
    bot: "Assistant",
    agent: "Agent",
    system: "Syst├¿me",
    newChat: "Nouvelle conversation",
    offline: "Service de clavardage indisponible.",
    agentsOffline:
      "Nos agents ne sont pas joignables via le clavardage pour le moment. Appelez-nous au +1 (514) 555-0123 ou ├⌐crivez ├á info@logicmoov.ca et nous vous r├⌐pondrons rapidement.",
  },
  common: {
    loading: "ChargementΓÇª",
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
      "Book a reliable taxi in seconds. Fixed prices, professional drivers and real-time tracking ΓÇö from Montreal to Quebec City and beyond.",
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
          "Fast urban trips at a fixed price ΓÇö no surprises, no surge pricing.",
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
    subtitle: "No app required ΓÇö book directly online.",
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
        description: "Premium SUV for your business travel.",
        seats: 8,
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
          "Pay by card, online or with a corporate account ΓÇö your choice.",
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
      "Trois-Rivi├¿res",
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
        author: "Jean-Fran├ºois T.",
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
      passengers: "Passengers",
      vehicle: "Vehicle",
      details: "Details",
      confirm: "Confirmation",
    },
    tripType: "Trip type",
    oneWay: "One way",
    roundTrip: "Round trip",
    pickup: "Pickup",
    pickupPlaceholder: "e.g. 1000 De la Gaucheti├¿re St, Montreal",
    dropoff: "Destination",
    dropoffPlaceholder: "e.g. Montreal-Trudeau Airport (YUL)",
    date: "Date",
    time: "Time",
    passengers: "Passengers",
    adults: "Adults",
    adultsAge: "12+ years",
    children: "Children",
    childrenAge: "2-11 years",
    infants: "Infants",
    infantsAge: "Under 2 years",
    childSeatRequirements: "Child Seat Requirements",
    infantSeat: "Infant Seat (0-2 years)",
    childSeat: "Child Seat (2-5 years)",
    boosterSeat: "Booster Seat (5+ years)",
    quantity: "Quantity",
    recommended: "Recommended",
    locationSearchUnavailable:
      "Address suggestions are unavailable. Check your Google Maps key.",
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
    notesPlaceholder: "Flight number, special instructionsΓÇª",
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
    submitting: "ProcessingΓÇª",
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
      "From airport transfers to business travel, our mission is to get you to your destination with confidence ΓÇö in French and in English.",
    ],
    valuesTitle: "Our values",
    foundersTitle: "Meet the founders",
    foundersSubtitle:
      "Discover the founding team behind LogicMoov and our vision for more reliable transportation across Quebec.",
    values: [
      { title: "Reliability", description: "Punctuality and consistent service on every ride." },
      { title: "Transparency", description: "Clear fixed prices with no hidden fees." },
      { title: "Safety", description: "Verified drivers and traceable trips." },
      { title: "Community", description: "Bilingual service rooted in Quebec communities." },
    ],
    registeredTitle: "Registered business",
    registeredText:
      "LogicMoov is a provincially registered business in Qu├⌐bec, Canada ΓÇö NEQ 2282359860.",
    detailsTitle: "LogicMoov at a glance",
    details: [
      { label: "Qu├⌐bec business number (NEQ)", value: "2282359860" },
      { label: "In business since", value: "2026" },
      { label: "Fleet size", value: "30+ vehicles" },
      { label: "Regions served", value: "Montreal and surrounding area" },
      {
        label: "Airport served",
        value: "Montr├⌐al Trudeau International Airport",
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
    address: "1000 De la Gaucheti├¿re St W, Montreal, QC",
    formName: "Name",
    formEmail: "Email",
    formMessage: "Message",
    formSubmit: "Send message",
    formSuccess: "Thank you! Your message has been sent.",
  },
  cancellationPolicy: {
    title: "Cancellation Policy",
    lead:
      "LogicMoov Airport Transfer Cancellation Policy. We understand plans can change. Here's how cancellations work for our airport transfer bookings.",
    items: [
      {
        title: "1. Free Cancellation",
        description:
          "Customers may cancel their booking free of charge up to 24 hours before the scheduled pickup time.",
      },
      {
        title: "2. Cancellation Charges",
        description:
          "More than 24 hours before pickup: No cancellation fee (100% refund). • Between 24 hours and 2 hours before pickup: 50% of the booking fare will be charged. • Less than 2 hours before pickup: 100% of the booking fare will be charged.",
      },
      {
        title: "3. No-Show Policy",
        description:
          "A booking is considered a No-Show if the passenger does not arrive at the agreed pickup location within the complimentary waiting time, cannot be contacted using the provided phone number, or leaves the pickup location without informing LogicMoov. No-Shows are non-refundable.",
      },
      {
        title: "4. Complimentary Waiting Time",
        description:
          "Airport Pickups: Up to 60 minutes of complimentary waiting time after the flight has landed. • Hotel, Residence, or Other Locations: Up to 15 minutes of complimentary waiting time after the scheduled pickup time. Additional waiting time may be charged according to the applicable waiting rate.",
      },
      {
        title: "5. Flight Delays",
        description:
          "For airport pickups, LogicMoov monitors flight arrivals. If a flight is delayed, the driver's pickup time will be adjusted whenever operationally possible, and no additional charge will apply for the delay itself.",
      },
      {
        title: "6. Flight Cancellations",
        description:
          "Customers must notify LogicMoov as soon as possible if a flight is cancelled. If cancellation occurs more than 24 hours before the scheduled pickup, a full refund will be issued. Otherwise, the standard cancellation policy applies.",
      },
      {
        title: "7. Driver Delays",
        description:
          "If LogicMoov is unable to provide the booked service due to operational issues, customers will receive either a full refund or an alternative vehicle at no additional cost, subject to availability.",
      },
      {
        title: "8. Booking Modifications",
        description:
          "Changes to pickup time, flight number, destination, or passenger details may be requested up to 24 hours before pickup, subject to availability. Additional charges may apply if the journey changes significantly.",
      },
      {
        title: "9. Refund Processing",
        description:
          "Approved refunds will be processed to the original payment method within 5–10 business days, depending on the payment provider.",
      },
      {
        title: "10. Force Majeure",
        description:
          "LogicMoov is not liable for delays or service interruptions caused by circumstances beyond its reasonable control, including severe weather, road closures, natural disasters, government actions, or major traffic incidents. Refunds in these situations will be assessed on a case-by-case basis.",
      },
      {
        title: "11. Operating Hours",
        description: "24 Hours / 7 Days a Week (24/7/365).",
      },
      {
        title: "12. Minimum Notice Period (Hours)",
        description:
          "Customers can book an airport transfer up to 2 hours before the scheduled pickup time.",
      },
      {
        title: "13. Airport Meeting Instructions",
        description:
          "After collecting your luggage, please proceed to the designated pickup area for your terminal.\n\n- Your driver will monitor your flight and adjust the pickup time if your flight arrives early or is delayed.\n- Complimentary waiting time of 60 minutes begins from the actual flight landing time.\n- Your driver will contact you via phone, SMS, or WhatsApp using the contact details provided in your booking.\n- Please keep your mobile phone switched on after landing.\n- If you are unable to locate your driver, contact LogicMoov Customer Support immediately using the phone number provided in your booking confirmation.\n- For airport pickups requiring a meet-and-greet service, your driver will wait in the arrivals hall with a sign displaying the lead passenger's name (where this service has been selected).\n- If you experience delays with immigration or baggage claim, please notify LogicMoov as soon as possible to help us coordinate your pickup.\n- Additional waiting time beyond the complimentary period may incur extra charges.\n\nThank you for choosing LogicMoov. We look forward to providing you with a safe, reliable, and comfortable airport transfer.",
      },
    ],
    fareDetails: {
      title: "Fare Details - One-Way Ride",
      destinationZone: "Destination Zone",
      distance: "Distance",
      suggestedFixedFare: "Suggested Fixed Fare",
      rows: [
        { destination: "Downtown", distance: "20 km", fare: "$49.45 (regulated)" },
        { destination: "Old Montreal", distance: "22 km", fare: "$49.45" },
        { destination: "Plateau", distance: "23 km", fare: "$55" },
        { destination: "Laval", distance: "28 km", fare: "$80" },
        { destination: "Longueuil", distance: "30 km", fare: "$85" },
        { destination: "Brossard", distance: "35 km", fare: "$95" },
        { destination: "Vaudreuil", distance: "42 km", fare: "$105" },
        { destination: "Mirabel", distance: "55 km", fare: "$125" },
      ],
    },
  },
  footer: {
    tagline: "Modern, reliable, bilingual taxi transportation across Quebec.",
    company: "Company",
    meetFounders: "Meet the founders",
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
    subtitleBot: "Virtual assistant ┬╖ instant answers",
    subtitleWaiting: "Connecting you to an agentΓÇª",
    subtitleAgent: "You're chatting with an agent",
    subtitleResolved: "Conversation ended",
    greeting:
      "Hi! How can I help you today? Ask me about pricing, booking or our services.",
    placeholder: "Type your messageΓÇª",
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
    loading: "LoadingΓÇª",
  },
};

const dictionaries: Record<Locale, Dictionary> = { fr, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
