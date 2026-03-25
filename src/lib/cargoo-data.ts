export type TravelLane = {
  id: string;
  originCity: string;
  originCountry: string;
  destinationCity: string;
  destinationCountry: string;
  averageTransit: string;
  weeklyTrips: number;
  typicalSpace: string;
  demandScore: string;
  highlights: string[];
};

export type TripListing = {
  id: string;
  travelerName: string;
  role: string;
  originCity: string;
  originCountry: string;
  destinationCity: string;
  destinationCountry: string;
  departureDay: string;
  departureDate: string;
  departureTime: string;
  dateBucket: "this-week" | "weekend" | "next-week";
  timeBucket: "morning" | "afternoon" | "night";
  arrivalDate: string;
  vehicle: string;
  availableSpace: string;
  spaceCategory: "small" | "medium" | "large";
  responseTime: string;
  trustScore: number;
  status: string;
  lastCheckpoint: string;
  contactPreference: string;
  meetingPoint: string;
  highlights: string[];
};

export type TrackingItem = {
  id: string;
  trackingCode: string;
  item: string;
  senderName: string;
  travelerName: string;
  route: string;
  status: "Reservado" | "Recogido" | "En ruta" | "Entregado";
  statusDetail: string;
  updatedAt: string;
  checkpoint: string;
  eta: string;
  contactLabel: string;
};

export type CarrierContactRequest = {
  id: string;
  senderName: string;
  item: string;
  route: string;
  requestedFor: string;
  pickupWindow: string;
  requestedSpace: string;
  preferredContact: string;
  note: string;
  urgency: "Alta" | "Media" | "Flexible";
};

export type CarrierShipmentStage = "Acordado" | "Recogido" | "En ruta" | "Entregado";

export type CarrierShipment = {
  id: string;
  trackingCode: string;
  senderName: string;
  item: string;
  route: string;
  travelSlot: string;
  stage: CarrierShipmentStage;
  updatedAt: string;
  checkpoint: string;
  eta: string;
  shareUrl: string;
  summary: string;
  nextAction: string;
};

export const carrierStageFlow: CarrierShipmentStage[] = ["Acordado", "Recogido", "En ruta", "Entregado"];

export const travelLanes: TravelLane[] = [
  {
    id: "zurich-barcelona",
    originCity: "Zurich",
    originCountry: "Suiza",
    destinationCity: "Barcelona",
    destinationCountry: "Espana",
    averageTransit: "36-48 h",
    weeklyTrips: 41,
    typicalSpace: "60-120 kg",
    demandScore: "Muy activa",
    highlights: ["Recogida flexible", "Paradas en Zurich y Basilea", "Ideal para cajas y maletas"],
  },
  {
    id: "basel-madrid",
    originCity: "Basel",
    originCountry: "Suiza",
    destinationCity: "Madrid",
    destinationCountry: "Espana",
    averageTransit: "48 h",
    weeklyTrips: 33,
    typicalSpace: "40-90 kg",
    demandScore: "Alta",
    highlights: ["Salida frecuente", "Contacto rapido", "Entrega coordinada"],
  },
  {
    id: "geneva-lisbon",
    originCity: "Ginebra",
    originCountry: "Suiza",
    destinationCity: "Lisboa",
    destinationCountry: "Portugal",
    averageTransit: "48-60 h",
    weeklyTrips: 29,
    typicalSpace: "80-140 kg",
    demandScore: "Alta",
    highlights: ["Espacio para maletas", "Paradas familiares", "Seguimiento activo"],
  },
  {
    id: "zurich-porto",
    originCity: "Zurich",
    originCountry: "Suiza",
    destinationCity: "Porto",
    destinationCountry: "Portugal",
    averageTransit: "48 h",
    weeklyTrips: 22,
    typicalSpace: "50-80 kg",
    demandScore: "Media-alta",
    highlights: ["Perfecto para compras", "Transportistas recurrentes", "Actualizaciones sencillas"],
  },
  {
    id: "basel-belgrade",
    originCity: "Basel",
    originCountry: "Suiza",
    destinationCity: "Belgrado",
    destinationCountry: "Serbia",
    averageTransit: "30-40 h",
    weeklyTrips: 19,
    typicalSpace: "40-70 kg",
    demandScore: "Muy activa",
    highlights: ["Ruta muy conocida", "Buen tiempo de respuesta", "Paradas claras"],
  },
  {
    id: "zurich-tirana",
    originCity: "Zurich",
    originCountry: "Suiza",
    destinationCity: "Tirana",
    destinationCountry: "Albania",
    averageTransit: "36-42 h",
    weeklyTrips: 17,
    typicalSpace: "90-160 kg",
    demandScore: "Alta",
    highlights: ["Comunidad activa", "Espacio grande", "Seguimiento por estados"],
  },
];

export const trips: TripListing[] = [
  {
    id: "trip-1",
    travelerName: "Marta S.",
    role: "Transportista verificada",
    originCity: "Zurich",
    originCountry: "Suiza",
    destinationCity: "Barcelona",
    destinationCountry: "Espana",
    departureDay: "Vie 28 Mar",
    departureDate: "28 Mar 2026",
    departureTime: "07:30",
    dateBucket: "this-week",
    timeBucket: "morning",
    arrivalDate: "Sab 29 Mar 2026",
    vehicle: "Volkswagen Passat",
    availableSpace: "4 cajas medianas o 85 kg",
    spaceCategory: "medium",
    responseTime: "< 15 min",
    trustScore: 4.9,
    status: "Disponible hoy",
    lastCheckpoint: "Zurich confirmada",
    contactPreference: "WhatsApp y llamada",
    meetingPoint: "Oerlikon o salida A1",
    highlights: ["120 viajes completados", "Responde muy rapido", "Seguimiento activo"],
  },
  {
    id: "trip-2",
    travelerName: "Joao M.",
    role: "Transportista recurrente",
    originCity: "Ginebra",
    originCountry: "Suiza",
    destinationCity: "Lisboa",
    destinationCountry: "Portugal",
    departureDay: "Sab 29 Mar",
    departureDate: "29 Mar 2026",
    departureTime: "06:00",
    dateBucket: "weekend",
    timeBucket: "morning",
    arrivalDate: "Lun 31 Mar 2026",
    vehicle: "Mercedes Vito",
    availableSpace: "2 maletas grandes o 140 kg",
    spaceCategory: "large",
    responseTime: "< 30 min",
    trustScore: 4.8,
    status: "Sale este finde",
    lastCheckpoint: "Ginebra lista para salida",
    contactPreference: "Llamada o chat",
    meetingPoint: "Meyrin y aeropuerto",
    highlights: ["Rutas todas las semanas", "Ideal para equipaje", "Entrega flexible"],
  },
  {
    id: "trip-3",
    travelerName: "Nikola P.",
    role: "Transportista comunidad serbia",
    originCity: "Basel",
    originCountry: "Suiza",
    destinationCity: "Belgrado",
    destinationCountry: "Serbia",
    departureDay: "Dom 30 Mar",
    departureDate: "30 Mar 2026",
    departureTime: "21:00",
    dateBucket: "weekend",
    timeBucket: "night",
    arrivalDate: "Mar 1 Abr 2026",
    vehicle: "Skoda Superb",
    availableSpace: "3 bultos fragiles o 60 kg",
    spaceCategory: "medium",
    responseTime: "< 10 min",
    trustScore: 4.9,
    status: "Salida nocturna",
    lastCheckpoint: "Basel lista",
    contactPreference: "WhatsApp",
    meetingPoint: "Centro Basel o autopista A2",
    highlights: ["Muy buen historial", "Paradas claras", "Seguimiento por checkpoint"],
  },
  {
    id: "trip-4",
    travelerName: "Arben K.",
    role: "Transportista comunidad albanesa",
    originCity: "Zurich",
    originCountry: "Suiza",
    destinationCity: "Tirana",
    destinationCountry: "Albania",
    departureDay: "Lun 31 Mar",
    departureDate: "31 Mar 2026",
    departureTime: "06:45",
    dateBucket: "next-week",
    timeBucket: "morning",
    arrivalDate: "Mar 1 Abr 2026",
    vehicle: "Ford Transit Custom",
    availableSpace: "Mini mudanza o 190 kg",
    spaceCategory: "large",
    responseTime: "< 20 min",
    trustScore: 5,
    status: "Proxima salida",
    lastCheckpoint: "Zurich oeste",
    contactPreference: "Telefono y chat",
    meetingPoint: "Altstetten y Dietikon",
    highlights: ["Mucho espacio", "Muy valorado", "Bueno para cajas familiares"],
  },
  {
    id: "trip-5",
    travelerName: "Sofia R.",
    role: "Transportista familiar",
    originCity: "Basel",
    originCountry: "Suiza",
    destinationCity: "Madrid",
    destinationCountry: "Espana",
    departureDay: "Jue 2 Abr",
    departureDate: "2 Abr 2026",
    departureTime: "15:00",
    dateBucket: "next-week",
    timeBucket: "afternoon",
    arrivalDate: "Vie 3 Abr 2026",
    vehicle: "Peugeot 5008",
    availableSpace: "1 bici plegable o 75 kg",
    spaceCategory: "medium",
    responseTime: "< 45 min",
    trustScore: 4.7,
    status: "Disponible tarde",
    lastCheckpoint: "Basel centro",
    contactPreference: "Chat en la app",
    meetingPoint: "Basel SBB",
    highlights: ["Buena para paquetes medianos", "Entrega tranquila", "Horario claro"],
  },
  {
    id: "trip-6",
    travelerName: "Ines F.",
    role: "Transportista ruta Porto",
    originCity: "Zurich",
    originCountry: "Suiza",
    destinationCity: "Porto",
    destinationCountry: "Portugal",
    departureDay: "Vie 4 Abr",
    departureDate: "4 Abr 2026",
    departureTime: "20:00",
    dateBucket: "next-week",
    timeBucket: "night",
    arrivalDate: "Sab 5 Abr 2026",
    vehicle: "Audi A6 Avant",
    availableSpace: "2 cajas grandes o 55 kg",
    spaceCategory: "small",
    responseTime: "< 25 min",
    trustScore: 4.8,
    status: "Salida de noche",
    lastCheckpoint: "Zurich central",
    contactPreference: "WhatsApp",
    meetingPoint: "HB o Schlieren",
    highlights: ["Buena para compras", "Entrega rapida", "Muy puntual"],
  },
];

export const trackingItems: TrackingItem[] = [
  {
    id: "track-301",
    trackingCode: "CG-4F92H1",
    item: "Caja con ropa infantil",
    senderName: "Laura P.",
    travelerName: "Marta S.",
    route: "Zurich -> Barcelona",
    status: "En ruta",
    statusDetail: "El transportista ya ha salido y mantiene la hora estimada.",
    updatedAt: "Hoy, 10:20",
    checkpoint: "Ultimo punto: Area de servicio de Lyon",
    eta: "Entrega prevista manana 19:00",
    contactLabel: "Codigo compartido por Marta",
  },
  {
    id: "track-302",
    trackingCode: "CG-91Q7LM",
    item: "Maleta azul",
    senderName: "Ana M.",
    travelerName: "Joao M.",
    route: "Ginebra -> Lisboa",
    status: "Recogido",
    statusDetail: "La maleta ya fue recogida y espera salida en la madrugada.",
    updatedAt: "Hoy, 06:40",
    checkpoint: "Ultimo punto: Meyrin",
    eta: "Salida prevista hoy a las 06:00",
    contactLabel: "Seguimiento activo para Ana",
  },
  {
    id: "track-303",
    trackingCode: "CG-T8K2PA",
    item: "2 cajas familiares",
    senderName: "Elira D.",
    travelerName: "Arben K.",
    route: "Zurich -> Tirana",
    status: "Reservado",
    statusDetail: "El transportista confirmo el hueco y quedasteis para la recogida.",
    updatedAt: "Ayer, 21:10",
    checkpoint: "Recogida en Altstetten",
    eta: "Salida prevista lun 31 Mar 06:45",
    contactLabel: "Codigo creado para Elira",
  },
];

export const carrierRequests: CarrierContactRequest[] = [
  {
    id: "req-101",
    senderName: "Laura P.",
    item: "Caja con ropa infantil",
    route: "Zurich -> Barcelona",
    requestedFor: "Salida de este viernes",
    pickupWindow: "Hoy 18:30 - 20:00",
    requestedSpace: "1 caja mediana",
    preferredContact: "WhatsApp",
    note: "Puedo acercarme a Oerlikon y necesito confirmacion antes de las 17:00.",
    urgency: "Alta",
  },
  {
    id: "req-102",
    senderName: "Miguel R.",
    item: "Mini maleta negra",
    route: "Basel -> Madrid",
    requestedFor: "Salida de la semana que viene",
    pickupWindow: "Manana 12:00 - 14:00",
    requestedSpace: "1 bulto pequeno",
    preferredContact: "Llamada",
    note: "Si te encaja, te paso ubicacion exacta y la persona de entrega en Madrid.",
    urgency: "Media",
  },
  {
    id: "req-103",
    senderName: "Elira D.",
    item: "2 cajas familiares",
    route: "Zurich -> Tirana",
    requestedFor: "Salida del lunes",
    pickupWindow: "Domingo por la tarde",
    requestedSpace: "2 cajas medianas",
    preferredContact: "WhatsApp",
    note: "Ya tengo todo preparado. Solo necesito saber donde hacemos la recogida.",
    urgency: "Alta",
  },
  {
    id: "req-104",
    senderName: "Tiago S.",
    item: "Bolsa grande con ropa",
    route: "Ginebra -> Lisboa",
    requestedFor: "Sin prisa, cualquier salida esta semana",
    pickupWindow: "Flexible",
    requestedSpace: "1 bulto blando",
    preferredContact: "Chat",
    note: "Puedo dejarlo en Meyrin si sales desde ahi.",
    urgency: "Flexible",
  },
];

export const carrierShipments: CarrierShipment[] = [
  {
    id: "shipment-1",
    trackingCode: "CG-4F92H1",
    senderName: "Laura P.",
    item: "Caja con ropa infantil",
    route: "Zurich -> Barcelona",
    travelSlot: "Vie 28 Mar - 07:30",
    stage: "En ruta",
    updatedAt: "Hoy, 10:20",
    checkpoint: "Area de servicio de Lyon",
    eta: "Sab 29 Mar - 19:00",
    shareUrl: "/tracking/CG-4F92H1",
    summary: "La caja ya va cargada y el viaje sigue el horario previsto.",
    nextAction: "Avisar al llegar a Barcelona y marcar entregado.",
  },
  {
    id: "shipment-2",
    trackingCode: "CG-91Q7LM",
    senderName: "Ana M.",
    item: "Maleta azul",
    route: "Ginebra -> Lisboa",
    travelSlot: "Sab 29 Mar - 06:00",
    stage: "Recogido",
    updatedAt: "Hoy, 06:40",
    checkpoint: "Meyrin",
    eta: "Lun 31 Mar - 12:00",
    shareUrl: "/tracking/CG-91Q7LM",
    summary: "Ya recogiste la maleta y esta lista para salir contigo en la madrugada.",
    nextAction: "Marcar en ruta cuando arranques.",
  },
  {
    id: "shipment-3",
    trackingCode: "CG-T8K2PA",
    senderName: "Elira D.",
    item: "2 cajas familiares",
    route: "Zurich -> Tirana",
    travelSlot: "Lun 31 Mar - 06:45",
    stage: "Acordado",
    updatedAt: "Ayer, 21:10",
    checkpoint: "Recogida pendiente en Altstetten",
    eta: "Mar 1 Abr - 18:00",
    shareUrl: "/tracking/CG-T8K2PA",
    summary: "El acuerdo esta cerrado y el codigo de seguimiento ya se puede compartir.",
    nextAction: "Recoger las cajas y marcar recogido.",
  },
];

export const carrierChecklist = [
  "Responder solicitudes nuevas antes de cerrar la ruta.",
  "Confirmar punto y hora de recogida con cada emisor aceptado.",
  "Compartir el codigo de seguimiento al cerrar el acuerdo.",
  "Actualizar el estado cuando recojas, salgas y entregues.",
];

export const senderMetrics = [
  { label: "Transportistas guardados", value: "12" },
  { label: "Envios en seguimiento", value: "3" },
  { label: "Respuesta media", value: "18 min" },
];

export const carrierMetrics = [
  { label: "Solicitudes nuevas", value: "4" },
  { label: "Recogidas de hoy", value: "2" },
  { label: "Codigos activos", value: "3" },
];

export const safetyLayers = [
  {
    title: "Perfil claro",
    bullets: ["Nombre y reputacion visibles", "Vehiculo y ruta publicados", "Tiempo de respuesta a la vista"],
  },
  {
    title: "Seguimiento simple",
    bullets: ["Codigo compartible", "Recogido", "En ruta", "Entregado"],
  },
  {
    title: "Contacto directo",
    bullets: ["Acuerdo fuera de la app", "Sin pagos integrados", "Sin procesos innecesarios"],
  },
];

export const installBenefits = [
  "Abrir Cargoo rapido para buscar transportistas.",
  "Consultar el estado del envio desde el movil.",
  "Abrir un seguimiento por codigo sin depender de chats externos.",
];

export const testimonials = [
  {
    name: "Helena, Zurich",
    quote:
      "Lo que mas me ayudo fue poder filtrar rapido y ver quien salia esa misma semana sin tener que publicar una solicitud.",
  },
  {
    name: "Dragan, Basel",
    quote:
      "Como transportista me funciona porque entro y veo solicitudes, recogidas pendientes y los codigos activos en un vistazo.",
  },
  {
    name: "Arta, Winterthur",
    quote:
      "El seguimiento simple me basta: acuerdo, recogido y en ruta. Mucho mas claro para mi familia.",
  },
];

export const faqItems = [
  {
    question: "Como funciona Cargoo?",
    answer:
      "El emisor entra, filtra salida, destino, fecha, hora y espacio, elige un transportista y lo contacta.",
  },
  {
    question: "Que ve el transportista al entrar?",
    answer:
      "Solicitudes de contacto, recogidas pendientes, estados del viaje y codigos de seguimiento para compartir.",
  },
  {
    question: "Hay pagos dentro de la app?",
    answer:
      "No. Cargoo no gestiona pagos. La app sirve para encontrar transportistas, contactar y ver el estado del envio.",
  },
  {
    question: "Como se hace el seguimiento?",
    answer:
      "El transportista actualiza cada etapa y puede compartir una pagina de seguimiento con un codigo generado automaticamente.",
  },
];
