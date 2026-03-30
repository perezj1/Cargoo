import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { localeMessages, normalizeLocale, type Locale } from "@/locales";
import { normalizeSearchText } from "@/lib/search-normalization";

type PushEventPayload =
  | { eventType: "trip_checkpoint_reached"; tripId: string; stopId: string; city?: string }
  | { eventType: "shipment_delivered"; shipmentId: string }
  | { eventType: "message_received"; messageId: string };

const PUSH_FUNCTION_NAME = "send-reminders";

const triggerPushEvent = async (payload: PushEventPayload) => {
  const { error } = await supabase.functions.invoke(PUSH_FUNCTION_NAME, {
    body: payload,
  });

  if (error) {
    throw error;
  }
};

export interface CargooUser {
  userId: string;
  name: string;
  email: string;
  locale: Locale;
  isTraveler: boolean;
  isPublic: boolean;
  vehicleType: string;
  avatarUrl: string;
  phone: string;
  location: string;
  bio: string;
}

export interface CargooTrip {
  id: string;
  origin: string;
  destination: string;
  date: string;
  recurrence: TripRecurrence;
  vehicleType: string;
  capacityKg: number;
  usedKg: number;
  requests: number;
  notes: string;
  status: "active" | "completed";
  createdAt: string;
}

export interface CargooTripStop {
  id: string;
  city: string;
  order: number;
  reachedAt: string | null;
}

export interface CargooTripDetails extends CargooTrip {
  stops: CargooTripStop[];
  currentStopIndex: number;
  lastCheckpointCity: string;
  lastCheckpointAt: string | null;
  nextStop: CargooTripStop | null;
  progressPercent: number;
  trackingAvailable: boolean;
}

export interface PublicTripListing {
  id: string;
  userId: string;
  carrierName: string;
  carrierAvatarUrl: string;
  carrierLocation: string;
  averageRating: number | null;
  reviewsCount: number;
  origin: string;
  destination: string;
  date: string;
  recurrence: TripRecurrence;
  vehicleType: string;
  capacityKg: number;
  availableKg: number;
  notes: string;
  tripsCount: number;
  routeCities: string[];
  stopCities: string[];
}

export interface PublicCarrierProfile {
  userId: string;
  name: string;
  avatarUrl: string;
  location: string;
  bio: string;
  phone: string;
  isTraveler: boolean;
  averageRating: number | null;
  reviewsCount: number;
  reviews: PublicTravelerReview[];
  trips: PublicTripListing[];
}

export interface PublicTravelerReview {
  id: string;
  senderName: string;
  rating: number;
  comment: string;
  reviewedAt: string | null;
  routeOrigin: string;
  routeDestination: string;
}

export type ShipmentStatus = "pending" | "accepted" | "delivered";

export interface ShipmentSummary {
  id: string;
  tripId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  travelerId: string;
  travelerName: string;
  travelerPhone: string;
  routeOrigin: string;
  routeDestination: string;
  tripDate: string;
  tripRecurrence: TripRecurrence;
  status: ShipmentStatus;
  createdAt: string;
  acceptedAt: string | null;
  deliveredAt: string | null;
  currentCheckpointCity: string;
  nextCheckpointCity: string | null;
  trackingProgressPercent: number;
  reviewRating: number | null;
  reviewComment: string;
  reviewedAt: string | null;
}

export interface TravelerRatingSummary {
  averageRating: number | null;
  reviewsCount: number;
}

export interface TravelerReviewsResult {
  averageRating: number | null;
  reviewsCount: number;
  reviews: PublicTravelerReview[];
}

export interface ConversationSummary {
  id: string;
  tripId: string | null;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl: string;
  otherUserIsTraveler: boolean;
  routeOrigin: string;
  routeDestination: string;
  lastMessageText: string;
  lastMessageAt: string;
  unreadCount: number;
  shipmentId: string | null;
  shipmentStatus: ShipmentStatus | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

interface SubmitShipmentReviewInput {
  shipmentId: string;
  rating: number;
  comment: string;
}

interface CreateConversationInput {
  otherUserId: string;
  otherUserName: string;
  otherUserIsTraveler: boolean;
  tripId?: string | null;
  routeOrigin?: string | null;
  routeDestination?: string | null;
}

interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  isTraveler: boolean;
  isPublic: boolean;
  locale: Locale;
  vehicleType: string;
}

interface CreateTripInput {
  origin: string;
  destination: string;
  date: string;
  recurrence: TripRecurrence;
  vehicleType: string;
  capacityKg: number;
  notes: string;
  routeStops?: string[];
}

export type TripRecurrence = "once" | "weekly" | "monthly";

type MetadataRecord = Record<string, unknown>;

const LEGACY_DEFAULT_LOCATION = "Madrid, Espana";
const DEFAULT_LOCATION = "";
let chatFeatureAvailable: boolean | null = null;
let shipmentFeatureAvailable: boolean | null = null;

const BUILTIN_BIO_EXAMPLES = new Set<string>();

for (const messages of Object.values(localeMessages)) {
  BUILTIN_BIO_EXAMPLES.add(messages.editProfilePage.travelerBioExample);
  BUILTIN_BIO_EXAMPLES.add(messages.editProfilePage.senderBioExample);
}

const getDefaultBio = (isTraveler: boolean, locale: Locale = "es") => {
  const messages = localeMessages[normalizeLocale(locale)];
  return isTraveler ? messages.editProfilePage.travelerBioExample : messages.editProfilePage.senderBioExample;
};

const normalizeProfileBio = (bio: string | null | undefined, isTraveler: boolean, locale: Locale = "es") => {
  const trimmed = typeof bio === "string" ? bio.trim() : "";

  if (!trimmed || BUILTIN_BIO_EXAMPLES.has(trimmed)) {
    return getDefaultBio(isTraveler, locale);
  }

  return trimmed;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ha ocurrido un error inesperado.";
};

const isMissingCargooTable = (error: { message?: string; code?: string } | null) => {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    /Could not find the table/i.test(error.message ?? "") ||
    /relation .* does not exist/i.test(error.message ?? "")
  );
};

const isMissingProfileAvatarColumn = (error: { message?: string; code?: string } | null) => {
  if (!error) {
    return false;
  }

  return /avatar_url/i.test(error.message ?? "") && /cargoo_profiles/i.test(error.message ?? "");
};

const isMissingProfileLocaleColumn = (error: { message?: string; code?: string } | null) => {
  if (!error) {
    return false;
  }

  return /locale/i.test(error.message ?? "") && /cargoo_profiles/i.test(error.message ?? "");
};

const isMissingProfileVehicleColumn = (error: { message?: string; code?: string } | null) => {
  if (!error) {
    return false;
  }

  return /vehicle_type/i.test(error.message ?? "") && /cargoo_profiles/i.test(error.message ?? "");
};

const isMissingTripVehicleColumn = (error: { message?: string; code?: string } | null) => {
  if (!error) {
    return false;
  }

  return /vehicle_type/i.test(error.message ?? "") && /cargoo_trips/i.test(error.message ?? "");
};

const isMissingTripRecurrenceColumn = (error: { message?: string; code?: string } | null) => {
  if (!error) {
    return false;
  }

  return /recurrence_type/i.test(error.message ?? "") && /cargoo_trips/i.test(error.message ?? "");
};

const mapSupabaseError = (error: { message?: string } | null) => {
  if (!error) {
    return null;
  }

  return new Error(error.message ?? "Error de Supabase.");
};

const deriveNameFromEmail = (email: string) => {
  const localPart = email.split("@")[0] ?? "cargoo";
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();

  return (
    cleaned
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "Usuario Cargoo"
  );
};

const normalizeOptionalLocation = (value: string | null | undefined) => {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized === LEGACY_DEFAULT_LOCATION ? "" : normalized;
};

const normalizeTripRecurrence = (value: unknown): TripRecurrence => {
  if (value === "weekly") {
    return "weekly";
  }

  if (value === "monthly") {
    return "monthly";
  }

  return "once";
};

const parseDateInput = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return Number.NaN;
  }

  return new Date(year, month - 1, day).getTime();
};

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const normalizeStopName = (value: string) => value.replace(/\s+/g, " ").trim();

const markShipmentFeatureUnavailable = () => {
  shipmentFeatureAvailable = false;
};

const markShipmentFeatureAvailable = () => {
  shipmentFeatureAvailable = true;
};

const isShipmentFeatureUnavailable = () => shipmentFeatureAvailable === false;

const buildRouteCities = (origin: string, destination: string, routeStops: string[] = []) => {
  const routeCityCandidates = [origin, ...routeStops, destination];
  const normalizedCities: string[] = [];

  routeCityCandidates.forEach((city) => {
    const nextCity = normalizeStopName(city);
    if (!nextCity) {
      return;
    }

    const previousCity = normalizedCities[normalizedCities.length - 1];
    if (previousCity && normalizeSearchText(previousCity) === normalizeSearchText(nextCity)) {
      return;
    }

    normalizedCities.push(nextCity);
  });

  if (!normalizedCities.length) {
    return [];
  }

  if (normalizedCities.length === 1) {
    return [normalizedCities[0]];
  }

  return normalizedCities;
};

const resolveTripStatus = (
  date: string,
  persistedStatus?: CargooTrip["status"] | null,
  recurrence: TripRecurrence = "once",
): CargooTrip["status"] => {
  if (persistedStatus === "completed") {
    return "completed";
  }

  if (recurrence !== "once") {
    return "active";
  }

  if (persistedStatus === "active") {
    return "active";
  }

  return parseDateInput(date) < parseDateInput(getTodayDateString()) ? "completed" : "active";
};

const getTripStatusFromDate = (date: string, recurrence: TripRecurrence = "once"): CargooTrip["status"] => {
  return resolveTripStatus(date, null, recurrence);
};

const markChatFeatureAvailable = () => {
  chatFeatureAvailable = true;
};

const markChatFeatureUnavailable = () => {
  chatFeatureAvailable = false;
};

const isChatFeatureUnavailable = () => chatFeatureAvailable === false;

const toMetadata = (user: User): MetadataRecord => {
  return (user.user_metadata ?? {}) as MetadataRecord;
};

const buildProfileFromMetadata = (user: User): CargooUser => {
  const metadata = toMetadata(user);
  const locale = typeof metadata.locale === "string" ? normalizeLocale(metadata.locale) : "es";
  const isTraveler = Boolean(metadata.is_traveler);

  return {
    userId: user.id,
    name: typeof metadata.name === "string" && metadata.name.trim() ? metadata.name : deriveNameFromEmail(user.email ?? ""),
    email: user.email ?? "",
    locale,
    isTraveler,
    isPublic: metadata.is_public === false ? false : true,
    vehicleType: typeof metadata.vehicle_type === "string" ? metadata.vehicle_type : "",
    avatarUrl: typeof metadata.avatar_url === "string" ? metadata.avatar_url : "",
    phone: typeof metadata.phone === "string" ? metadata.phone : "",
    location: normalizeOptionalLocation(typeof metadata.location === "string" ? metadata.location : DEFAULT_LOCATION),
    bio: normalizeProfileBio(typeof metadata.bio === "string" ? metadata.bio : "", isTraveler, locale),
  };
};

const profileToMetadata = (profile: CargooUser) => ({
  name: profile.name,
  locale: profile.locale,
  is_traveler: profile.isTraveler,
  is_public: profile.isPublic,
  vehicle_type: profile.vehicleType,
  avatar_url: profile.avatarUrl,
  phone: profile.phone,
  location: profile.location,
  bio: profile.bio,
});

const getMetadataTripRecords = (user: User) => {
  const metadata = toMetadata(user);
  return Array.isArray(metadata.cargoo_trips)
    ? (metadata.cargoo_trips as Record<string, unknown>[])
    : [];
};

const getMetadataTrips = (user: User): CargooTrip[] => {
  return getMetadataTripRecords(user)
    .map((trip) => {
      if (!trip || typeof trip !== "object") {
        return null;
      }

      const item = trip as Record<string, unknown>;
      if (
        typeof item.id !== "string" ||
        typeof item.origin !== "string" ||
        typeof item.destination !== "string" ||
        typeof item.date !== "string" ||
        typeof item.capacityKg !== "number" ||
        typeof item.usedKg !== "number" ||
        typeof item.requests !== "number" ||
        typeof item.notes !== "string" ||
        (item.status !== "active" && item.status !== "completed")
      ) {
        return null;
      }

      return {
        id: item.id,
        origin: item.origin,
        destination: item.destination,
        date: item.date,
        recurrence: normalizeTripRecurrence(item.recurrence),
        vehicleType: typeof item.vehicleType === "string" ? item.vehicleType : "",
        capacityKg: item.capacityKg,
        usedKg: item.usedKg,
        requests: item.requests,
        notes: item.notes,
        status: resolveTripStatus(item.date, item.status, normalizeTripRecurrence(item.recurrence)),
        createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
      } satisfies CargooTrip;
    })
    .filter((trip): trip is CargooTrip => trip !== null)
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
};

const getMetadataTripDetails = (user: User, tripId: string) => {
  const trip = getMetadataTrips(user).find((item) => item.id === tripId);
  if (!trip) {
    return null;
  }

  const tripRecord = getMetadataTripRecords(user).find((item) => item.id === tripId);
  const storedStops = Array.isArray(tripRecord?.routeStops)
    ? tripRecord.routeStops.filter((stop): stop is string => typeof stop === "string")
    : [];
  const routeCities = buildRouteCities(trip.origin, trip.destination, storedStops);
  const storedCurrentStopIndex = typeof tripRecord?.currentStopIndex === "number" ? tripRecord.currentStopIndex : 0;
  const currentStopIndex = Math.min(Math.max(storedCurrentStopIndex, 0), Math.max(routeCities.length - 1, 0));
  const now = new Date(trip.createdAt).toISOString();
  const stops = routeCities.map((city, index) => ({
    id: `${trip.id}-${index}`,
    city,
    order: index,
    reachedAt: index <= currentStopIndex ? now : null,
  }));

  return buildTripDetails(trip, stops, true);
};

const advanceMetadataTripToNextStop = async (user: User, tripDetails: CargooTripDetails) => {
  if (!tripDetails.nextStop) {
    return tripDetails;
  }

  const nextCurrentStopIndex = tripDetails.nextStop.order;
  const nextTrips = getMetadataTripRecords(user).map((tripRecord) => {
    if (tripRecord.id !== tripDetails.id) {
      return tripRecord;
    }

    return {
      ...tripRecord,
      currentStopIndex: nextCurrentStopIndex,
      status: tripRecord.status,
    };
  });

  const nextUser = await updateUserMetadata({ cargoo_trips: nextTrips });
  return getMetadataTripDetails(nextUser, tripDetails.id);
};

const updateUserMetadata = async (updates: MetadataRecord) => {
  const user = await requireUser();
  const nextMetadata = {
    ...toMetadata(user),
    ...updates,
  };

  const { data, error } = await supabase.auth.updateUser({
    data: nextMetadata,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("No se pudo actualizar la sesión de usuario.");
  }

  return data.user;
};

const requireUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error("No hay una sesión activa.");
  }

  return user;
};

const mapProfileRow = (
  row: {
    user_id: string;
    name: string;
    is_traveler: boolean;
    is_public: boolean;
    vehicle_type?: string | null;
    locale?: string | null;
    avatar_url?: string | null;
    phone?: string | null;
    location?: string | null;
    bio?: string | null;
  },
  email: string,
  fallbackAvatarUrl = "",
  fallbackLocale: Locale = "es",
): CargooUser => {
  const locale = row.locale ? normalizeLocale(row.locale) : fallbackLocale;
  const isTraveler = row.is_traveler;

  return {
    userId: row.user_id,
    name: row.name,
    email,
    locale,
    isTraveler,
    isPublic: row.is_public,
    vehicleType: row.vehicle_type ?? "",
    avatarUrl: row.avatar_url ?? fallbackAvatarUrl,
    phone: row.phone ?? "",
    location: normalizeOptionalLocation(row.location),
    bio: normalizeProfileBio(row.bio, isTraveler, locale),
  };
};

const mapTripRow = (row: {
  id: string;
  origin: string;
  destination: string;
  trip_date: string;
  recurrence_type?: string | null;
  vehicle_type: string | null;
  capacity_kg: number;
  used_kg: number;
  requests: number;
  notes: string | null;
  status: "active" | "completed";
  created_at: string | null;
}): CargooTrip => ({
  id: row.id,
  origin: row.origin,
  destination: row.destination,
  date: row.trip_date,
  recurrence: normalizeTripRecurrence(row.recurrence_type),
  vehicleType: row.vehicle_type ?? "",
  capacityKg: row.capacity_kg,
  usedKg: row.used_kg,
  requests: row.requests,
  notes: row.notes ?? "",
  status: resolveTripStatus(row.trip_date, row.status, normalizeTripRecurrence(row.recurrence_type)),
  createdAt: row.created_at ?? new Date().toISOString(),
});

type ConversationRow = Database["public"]["Tables"]["cargoo_conversations"]["Row"];
type MessageRow = Database["public"]["Tables"]["cargoo_messages"]["Row"];
type HiddenConversationRow = Database["public"]["Tables"]["cargoo_conversation_hidden_states"]["Row"];
type ShipmentRow = Database["public"]["Tables"]["cargoo_shipments"]["Row"];
type TripStopRow = Database["public"]["Tables"]["cargoo_trip_stops"]["Row"];

const mapTripStopRow = (row: TripStopRow): CargooTripStop => ({
  id: row.id,
  city: row.city,
  order: row.stop_order,
  reachedAt: row.reached_at,
});

const getGroupedTripStopsFromRows = (rows: Pick<TripStopRow, "trip_id" | "city" | "stop_order" | "reached_at">[]) => {
  const stopsByTripId = new Map<string, CargooTripStop[]>();

  rows.forEach((row) => {
    const currentStops = stopsByTripId.get(row.trip_id) ?? [];
    currentStops.push({
      id: `${row.trip_id}-${row.stop_order}`,
      city: row.city,
      order: row.stop_order,
      reachedAt: row.reached_at,
    });
    stopsByTripId.set(row.trip_id, currentStops);
  });

  return stopsByTripId;
};

const getPublicRouteCities = (trip: {
  id: string;
  origin: string;
  destination: string;
}, stopsByTripId: Map<string, CargooTripStop[]>) => {
  const storedStops = stopsByTripId.get(trip.id) ?? [];
  return buildRouteCities(
    trip.origin,
    trip.destination,
    storedStops
      .slice(1, -1)
      .map((stop) => stop.city),
  );
};

const buildPublicTripListing = (
  trip: {
    id: string;
    user_id: string;
    origin: string;
    destination: string;
    trip_date: string;
    recurrence_type?: string | null;
    vehicle_type: string | null;
    capacity_kg: number;
    used_kg: number;
    notes: string | null;
  },
  profile: {
    name: string;
    avatarUrl: string;
    location: string;
    averageRating: number | null;
    reviewsCount: number;
  } | undefined,
  tripsCount: number,
  stopsByTripId: Map<string, CargooTripStop[]>,
): PublicTripListing => {
  const routeCities = getPublicRouteCities(trip, stopsByTripId);

  return {
    id: trip.id,
    userId: trip.user_id,
    carrierName: profile?.name ?? "Conductor Cargoo",
    carrierAvatarUrl: profile?.avatarUrl ?? "",
    carrierLocation: normalizeOptionalLocation(profile?.location),
    averageRating: profile?.averageRating ?? null,
    reviewsCount: profile?.reviewsCount ?? 0,
    origin: trip.origin,
    destination: trip.destination,
    date: trip.trip_date,
    recurrence: normalizeTripRecurrence(trip.recurrence_type),
    vehicleType: trip.vehicle_type ?? "",
    capacityKg: trip.capacity_kg,
    availableKg: Math.max(trip.capacity_kg - trip.used_kg, 0),
    notes: trip.notes ?? "",
    tripsCount,
    routeCities,
    stopCities: routeCities.slice(1, -1),
  } satisfies PublicTripListing;
};

const buildDefaultTripStops = (trip: CargooTrip): CargooTripStop[] =>
  buildRouteCities(trip.origin, trip.destination).map((city, index) => ({
    id: `${trip.id}-${index}`,
    city,
    order: index,
    reachedAt: index === 0 ? trip.createdAt : trip.status === "completed" ? trip.createdAt : null,
  }));

const buildTripDetails = (
  trip: CargooTrip,
  rawStops: CargooTripStop[],
  trackingAvailable: boolean,
): CargooTripDetails => {
  const stops = [...rawStops].sort((left, right) => left.order - right.order);
  const resolvedStops = stops.length > 0 ? stops : buildDefaultTripStops(trip);
  const reachedStops = resolvedStops.filter((stop) => Boolean(stop.reachedAt));
  const currentStop = reachedStops[reachedStops.length - 1] ?? resolvedStops[0];
  const currentStopIndex = currentStop?.order ?? 0;
  const nextStop = resolvedStops.find((stop) => stop.order > currentStopIndex) ?? null;
  const progressBase = Math.max(resolvedStops.length - 1, 1);
  const progressPercent = resolvedStops.length === 1 ? 100 : Math.round((currentStopIndex / progressBase) * 100);

  return {
    ...trip,
    status: trip.status,
    stops: resolvedStops,
    currentStopIndex,
    lastCheckpointCity: currentStop?.city ?? trip.origin,
    lastCheckpointAt: currentStop?.reachedAt ?? null,
    nextStop,
    progressPercent,
    trackingAvailable,
  };
};

const mapConversationRow = (
  row: ConversationRow,
  currentUserId: string,
  unreadCount = 0,
  shipment: Pick<ShipmentRow, "id" | "status"> | null = null,
  otherUserAvatarUrl = "",
): ConversationSummary => {
  const isParticipantOne = row.participant_one_id === currentUserId;

  return {
    id: row.id,
    tripId: row.trip_id,
    otherUserId: isParticipantOne ? row.participant_two_id : row.participant_one_id,
    otherUserName: isParticipantOne ? row.participant_two_name : row.participant_one_name,
    otherUserAvatarUrl,
    otherUserIsTraveler: isParticipantOne ? row.participant_two_is_traveler : row.participant_one_is_traveler,
    routeOrigin: row.route_origin ?? "",
    routeDestination: row.route_destination ?? "",
    lastMessageText: row.last_message_text ?? "Sin mensajes todavía.",
    lastMessageAt: row.last_message_at ?? row.created_at ?? new Date().toISOString(),
    unreadCount,
    shipmentId: shipment?.id ?? null,
    shipmentStatus: shipment?.status ?? null,
  };
};

const mapMessageRow = (row: MessageRow): ChatMessage => ({
  id: row.id,
  conversationId: row.conversation_id,
  senderId: row.sender_id,
  content: row.content,
  createdAt: row.created_at ?? new Date().toISOString(),
  readAt: row.read_at,
});

const getHiddenConversationStatesForUser = async (userId: string, conversationIds: string[]) => {
  if (!conversationIds.length) {
    return new Map<string, HiddenConversationRow>();
  }

  const { data, error } = await supabase
    .from("cargoo_conversation_hidden_states")
    .select("conversation_id, user_id, hidden_at")
    .eq("user_id", userId)
    .in("conversation_id", conversationIds);

  if (isMissingCargooTable(error)) {
    return new Map<string, HiddenConversationRow>();
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  return new Map(((data as HiddenConversationRow[] | null) ?? []).map((row) => [row.conversation_id, row] as const));
};

const buildShipmentSummary = (
  row: ShipmentRow,
  tripDetails: CargooTripDetails | null,
  travelerPhone = "",
): ShipmentSummary => ({
  id: row.id,
  tripId: row.trip_id,
  conversationId: row.conversation_id,
  senderId: row.sender_id,
  senderName: row.sender_name,
  travelerId: row.traveler_id,
  travelerName: row.traveler_name,
  travelerPhone,
  routeOrigin: row.route_origin,
  routeDestination: row.route_destination,
  tripDate: tripDetails?.date ?? "",
  tripRecurrence: tripDetails?.recurrence ?? "once",
  status: row.status,
  createdAt: row.created_at ?? new Date().toISOString(),
  acceptedAt: row.accepted_at,
  deliveredAt: row.delivered_at,
  currentCheckpointCity: tripDetails?.lastCheckpointCity ?? row.route_origin,
  nextCheckpointCity: tripDetails?.nextStop?.city ?? null,
  trackingProgressPercent: tripDetails?.progressPercent ?? 0,
  reviewRating: row.review_rating,
  reviewComment: row.review_comment ?? "",
  reviewedAt: row.reviewed_at,
});

const getProfilePhonesByUserIds = async (userIds: string[]) => {
  if (!userIds.length) {
    return new Map<string, string>();
  }

  const uniqueUserIds = Array.from(new Set(userIds));
  const { data, error } = await supabase
    .from("cargoo_profiles")
    .select("user_id, phone")
    .in("user_id", uniqueUserIds);

  if (isMissingCargooTable(error)) {
    return new Map<string, string>();
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  return new Map((data ?? []).map((profile) => [profile.user_id, profile.phone ?? ""] as const));
};

const getProfileAvatarUrlsByUserIds = async (userIds: string[]) => {
  if (!userIds.length) {
    return new Map<string, string>();
  }

  const uniqueUserIds = Array.from(new Set(userIds));
  const { data, error } = await supabase
    .from("cargoo_profiles")
    .select("user_id, avatar_url")
    .in("user_id", uniqueUserIds);

  if (isMissingCargooTable(error) || isMissingProfileAvatarColumn(error)) {
    return new Map<string, string>();
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  return new Map(
    (data ?? [])
      .filter((profile) => Boolean(profile.avatar_url))
      .map((profile) => [profile.user_id, profile.avatar_url ?? ""] as const),
  );
};

const buildProfilePayload = (user: User) => {
  const profile = buildProfileFromMetadata(user);

  return {
    user_id: user.id,
    name: profile.name,
    locale: profile.locale,
    is_traveler: profile.isTraveler,
    is_public: profile.isPublic,
    vehicle_type: profile.vehicleType,
    avatar_url: profile.avatarUrl,
    phone: profile.phone,
    location: profile.location,
    bio: profile.bio,
  };
};

const upsertProfilePayload = async (payload: ReturnType<typeof buildProfilePayload>) => {
  const result = await supabase.from("cargoo_profiles").upsert(payload, { onConflict: "user_id" }).select("*").single();

  if (!isMissingProfileAvatarColumn(result.error) && !isMissingProfileLocaleColumn(result.error) && !isMissingProfileVehicleColumn(result.error)) {
    return result;
  }

  let fallbackPayload: Omit<typeof payload, "avatar_url" | "locale" | "vehicle_type"> & {
    avatar_url?: string;
    locale?: string;
    vehicle_type?: string;
  } = { ...payload };

  if (isMissingProfileAvatarColumn(result.error)) {
    const { avatar_url: _avatarUrl, ...payloadWithoutAvatar } = fallbackPayload;
    fallbackPayload = payloadWithoutAvatar;
  }

  if (isMissingProfileLocaleColumn(result.error)) {
    const { locale: _locale, ...payloadWithoutLocale } = fallbackPayload;
    fallbackPayload = payloadWithoutLocale;
  }

  if (isMissingProfileVehicleColumn(result.error)) {
    const { vehicle_type: _vehicleType, ...payloadWithoutVehicle } = fallbackPayload;
    fallbackPayload = payloadWithoutVehicle;
  }

  return supabase.from("cargoo_profiles").upsert(fallbackPayload, { onConflict: "user_id" }).select("*").single();
};

const ensureProfile = async (user: User) => {
  const { data, error } = await supabase.from("cargoo_profiles").select("*").eq("user_id", user.id).maybeSingle();

  if (isMissingCargooTable(error)) {
    const nextUser = await updateUserMetadata(profileToMetadata(buildProfileFromMetadata(user)));
    return buildProfileFromMetadata(nextUser);
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  if (data) {
    const metadataProfile = buildProfileFromMetadata(user);
    if (metadataProfile.avatarUrl && !data.avatar_url) {
      await upsertProfilePayload(buildProfilePayload(user));
    }

    return mapProfileRow(data, user.email ?? "", metadataProfile.avatarUrl, metadataProfile.locale);
  }

  const payload = buildProfilePayload(user);
  const { data: createdProfile, error: createError } = await upsertProfilePayload(payload);

  if (isMissingCargooTable(createError)) {
    const nextUser = await updateUserMetadata(profileToMetadata(buildProfileFromMetadata(user)));
    return buildProfileFromMetadata(nextUser);
  }

  const mappedCreateError = mapSupabaseError(createError);
  if (mappedCreateError) {
    throw mappedCreateError;
  }

  const metadataProfile = buildProfileFromMetadata(user);
  return mapProfileRow(createdProfile, user.email ?? "", metadataProfile.avatarUrl, metadataProfile.locale);
};

export const loginUser = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("No se pudo iniciar sesión.");
  }

  return ensureProfile(data.user);
};

export const registerUser = async ({ name, email, password, isTraveler, isPublic, locale, vehicleType }: RegisterUserInput) => {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        name,
        locale,
        is_traveler: isTraveler,
        is_public: isPublic,
        vehicle_type: isTraveler ? vehicleType.trim() : "",
        phone: "",
        location: DEFAULT_LOCATION,
        bio: getDefaultBio(isTraveler, locale),
        cargoo_trips: [],
      },
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.user && data.session) {
    const profile = await ensureProfile(data.user);
    return { profile, needsEmailConfirmation: false };
  }

  return { profile: null, needsEmailConfirmation: true };
};

export const getCurrentUser = async () => {
  const user = await requireUser();
  return ensureProfile(user);
};

export const updateCurrentUser = async (updates: Partial<CargooUser>) => {
  const user = await requireUser();

  if (updates.email && updates.email.trim() && updates.email.trim().toLowerCase() !== (user.email ?? "").toLowerCase()) {
    const { error: emailError } = await supabase.auth.updateUser({ email: updates.email.trim().toLowerCase() });

    if (emailError) {
      throw new Error(emailError.message);
    }
  }

  const currentProfile = buildProfileFromMetadata(user);
  const nextProfile: CargooUser = {
    ...currentProfile,
    ...updates,
    email: updates.email?.trim().toLowerCase() ?? currentProfile.email,
    locale: updates.locale ? normalizeLocale(updates.locale) : currentProfile.locale,
  };

  const nextUser = await updateUserMetadata({
    name: nextProfile.name,
    locale: nextProfile.locale,
    is_traveler: nextProfile.isTraveler,
    is_public: nextProfile.isPublic,
    vehicle_type: nextProfile.vehicleType,
    phone: nextProfile.phone,
    location: nextProfile.location,
    bio: nextProfile.bio,
  });

  const payload = {
    user_id: nextUser.id,
    name: nextProfile.name,
    locale: nextProfile.locale,
    is_traveler: nextProfile.isTraveler,
    is_public: nextProfile.isPublic,
    vehicle_type: nextProfile.vehicleType,
    avatar_url: nextProfile.avatarUrl,
    phone: nextProfile.phone,
    location: nextProfile.location,
    bio: nextProfile.bio,
  };

  const { data, error } = await upsertProfilePayload(payload);

  if (isMissingCargooTable(error)) {
    return buildProfileFromMetadata(nextUser);
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  return mapProfileRow(data, nextProfile.email, nextProfile.avatarUrl, nextProfile.locale);
};

export const uploadCurrentUserAvatar = async (file: File) => {
  const user = await requireUser();

  if (!file.type.startsWith("image/")) {
    throw new Error("Solo se permiten imagenes.");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("La imagen debe ser menor a 2 MB.");
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${user.id}/avatar.${fileExt}`;
  const cacheBuster = Date.now();

  const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);
  const avatarUrl = `${publicUrl}?t=${cacheBuster}`;
  const nextUser = await updateUserMetadata({ avatar_url: avatarUrl });
  const payload = buildProfilePayload(nextUser);

  const { data, error } = await upsertProfilePayload(payload);

  if (isMissingCargooTable(error)) {
    return buildProfileFromMetadata(nextUser);
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  return mapProfileRow(data, nextUser.email ?? "", avatarUrl, buildProfileFromMetadata(nextUser).locale);
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
};

export const getTrips = async () => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from("cargoo_trips")
    .select("*")
    .eq("user_id", user.id)
    .order("trip_date", { ascending: true });

  if (isMissingCargooTable(error)) {
    return getMetadataTrips(user);
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  return (data ?? []).map(mapTripRow);
};

export const deleteCompletedTrip = async (tripId: string) => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from("cargoo_trips")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("id", tripId)
    .maybeSingle();

  if (isMissingCargooTable(error)) {
    const metadataTrip = getMetadataTrips(user).find((trip) => trip.id === tripId);
    if (!metadataTrip) {
      throw new Error("No encontramos ese viaje.");
    }

    if (metadataTrip.status !== "completed") {
      throw new Error("Solo puedes eliminar viajes completados.");
    }

    const nextTrips = getMetadataTripRecords(user).filter((trip) => trip.id !== tripId);
    await updateUserMetadata({ cargoo_trips: nextTrips });
    return;
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  if (!data) {
    throw new Error("No encontramos ese viaje.");
  }

  if (data.status !== "completed") {
    throw new Error("Solo puedes eliminar viajes completados.");
  }

  const { error: deleteError } = await supabase.from("cargoo_trips").delete().eq("user_id", user.id).eq("id", tripId);
  const mappedDeleteError = mapSupabaseError(deleteError);
  if (mappedDeleteError) {
    throw mappedDeleteError;
  }
};

const getTripStopsFromSupabase = async (tripId: string) => {
  const { data, error } = await supabase
    .from("cargoo_trip_stops")
    .select("*")
    .eq("trip_id", tripId)
    .order("stop_order", { ascending: true });

  if (isMissingCargooTable(error)) {
    return {
      stops: null as CargooTripStop[] | null,
      trackingAvailable: false,
    };
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  return {
    stops: (data ?? []).map(mapTripStopRow),
    trackingAvailable: true,
  };
};

const getTripStopsByTripIds = async (tripIds: string[]) => {
  if (!tripIds.length) {
    return new Map<string, CargooTripStop[]>();
  }

  const { data, error } = await supabase
    .from("cargoo_trip_stops")
    .select("*")
    .in("trip_id", tripIds)
    .order("stop_order", { ascending: true });

  if (isMissingCargooTable(error)) {
    return null as Map<string, CargooTripStop[]> | null;
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  const stopsByTripId = new Map<string, CargooTripStop[]>();

  (data ?? []).forEach((row) => {
    const currentStops = stopsByTripId.get(row.trip_id) ?? [];
    currentStops.push(mapTripStopRow(row));
    stopsByTripId.set(row.trip_id, currentStops);
  });

  return stopsByTripId;
};

const getAccessibleTripDetailsByIds = async (tripIds: string[]) => {
  if (!tripIds.length) {
    return new Map<string, CargooTripDetails>();
  }

  const { data: trips, error: tripsError } = await supabase.from("cargoo_trips").select("*").in("id", tripIds);

  if (isMissingCargooTable(tripsError)) {
    return new Map<string, CargooTripDetails>();
  }

  const mappedTripsError = mapSupabaseError(tripsError);
  if (mappedTripsError) {
    throw mappedTripsError;
  }

  const tripRows = trips ?? [];
  const stopsByTripId = await getTripStopsByTripIds(tripRows.map((trip) => trip.id));
  const tripDetailsById = new Map<string, CargooTripDetails>();

  tripRows.forEach((tripRow) => {
    const trip = mapTripRow(tripRow);
    const tripDetails = buildTripDetails(trip, stopsByTripId?.get(trip.id) ?? buildDefaultTripStops(trip), Boolean(stopsByTripId));
    tripDetailsById.set(trip.id, tripDetails);
  });

  return tripDetailsById;
};

const getPublicTripStopsByTripIds = async (tripIds: string[]) => {
  if (!tripIds.length) {
    return new Map<string, CargooTripStop[]>();
  }

  const { data, error } = await supabase
    .from("cargoo_trip_stops")
    .select("trip_id, city, stop_order, reached_at")
    .in("trip_id", tripIds)
    .order("stop_order", { ascending: true });

  if (isMissingCargooTable(error)) {
    return new Map<string, CargooTripStop[]>();
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  return getGroupedTripStopsFromRows(data ?? []);
};

const getPublicTravelerRatingSummaries = async (travelerIds: string[]) => {
  if (!travelerIds.length || isShipmentFeatureUnavailable()) {
    return new Map<string, TravelerRatingSummary>();
  }

  const { data, error } = await supabase
    .from("cargoo_shipments")
    .select("traveler_id, review_rating")
    .in("traveler_id", travelerIds)
    .eq("status", "delivered")
    .not("review_rating", "is", null);

  if (isMissingCargooTable(error)) {
    markShipmentFeatureUnavailable();
    return new Map<string, TravelerRatingSummary>();
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  markShipmentFeatureAvailable();
  const ratingsByTravelerId = new Map<string, number[]>();

  (data ?? []).forEach((item) => {
    if (typeof item.review_rating !== "number") {
      return;
    }

    const currentRatings = ratingsByTravelerId.get(item.traveler_id) ?? [];
    currentRatings.push(item.review_rating);
    ratingsByTravelerId.set(item.traveler_id, currentRatings);
  });

  return new Map(
    Array.from(ratingsByTravelerId.entries()).map(([travelerId, ratings]) => [
      travelerId,
      {
        averageRating: Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)),
        reviewsCount: ratings.length,
      } satisfies TravelerRatingSummary,
    ]),
  );
};

const countUndeliveredTripShipments = async (tripId: string) => {
  if (isShipmentFeatureUnavailable()) {
    return 0;
  }

  const { count, error } = await supabase
    .from("cargoo_shipments")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", tripId)
    .neq("status", "delivered");

  if (isMissingCargooTable(error)) {
    markShipmentFeatureUnavailable();
    return 0;
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  markShipmentFeatureAvailable();
  return count ?? 0;
};

const syncTripCompletionState = async (userId: string, tripId: string) => {
  const tripDetails = await getTripById(tripId);
  if (!tripDetails) {
    return null as CargooTripDetails | null;
  }

  if (tripDetails.recurrence !== "once") {
    if (tripDetails.status === "completed") {
      const { error } = await supabase
        .from("cargoo_trips")
        .update({ status: "active" })
        .eq("id", tripId)
        .eq("user_id", userId);

      const mappedError = mapSupabaseError(error);
      if (mappedError) {
        throw mappedError;
      }

      return getTripById(tripId);
    }

    return tripDetails;
  }

  const shouldBeCompleted = !tripDetails.nextStop && (await countUndeliveredTripShipments(tripId)) === 0;
  const nextStatus: CargooTrip["status"] = shouldBeCompleted ? "completed" : "active";

  if (tripDetails.status === nextStatus) {
    return tripDetails;
  }

  const { error } = await supabase
    .from("cargoo_trips")
    .update({ status: nextStatus })
    .eq("id", tripId)
    .eq("user_id", userId);

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  return getTripById(tripId);
};

export const createTrip = async (trip: CreateTripInput) => {
  const user = await requireUser();
  const profile = await ensureProfile(user);
  const normalizedOrigin = trip.origin.trim();
  const normalizedDestination = trip.destination.trim();
  const normalizedRecurrence = normalizeTripRecurrence(trip.recurrence);
  const normalizedDate = normalizedRecurrence === "once" ? trip.date : trip.date || getTodayDateString();
  const normalizedVehicleType = trip.vehicleType.trim() || profile.vehicleType.trim();
  const normalizedNotes = trip.notes.trim() || "Sin notas adicionales.";
  if (normalizedRecurrence === "once" && parseDateInput(normalizedDate) < parseDateInput(getTodayDateString())) {
    throw new Error("La fecha del viaje no puede ser anterior a hoy.");
  }
  const nextStatus = getTripStatusFromDate(normalizedDate, normalizedRecurrence);
  const routeCities = buildRouteCities(normalizedOrigin, normalizedDestination, trip.routeStops ?? []);
  const nextTrip: CargooTrip = {
    id: `trip-${Date.now()}`,
    origin: normalizedOrigin,
    destination: normalizedDestination,
    date: normalizedDate,
    recurrence: normalizedRecurrence,
    vehicleType: normalizedVehicleType,
    capacityKg: trip.capacityKg,
    usedKg: 0,
    requests: 0,
    notes: normalizedNotes,
    status: nextStatus,
    createdAt: new Date().toISOString(),
  };

  const payload = {
    user_id: user.id,
    origin: normalizedOrigin,
    destination: normalizedDestination,
    trip_date: nextTrip.date,
    recurrence_type: normalizedRecurrence,
    vehicle_type: normalizedVehicleType || null,
    capacity_kg: nextTrip.capacityKg,
    used_kg: nextTrip.usedKg,
    requests: nextTrip.requests,
    notes: normalizedNotes,
    status: nextStatus,
  };

  let insertResult = await supabase.from("cargoo_trips").insert(payload).select("*").single();

  if (isMissingTripVehicleColumn(insertResult.error) || isMissingTripRecurrenceColumn(insertResult.error)) {
    let legacyPayload = { ...payload };

    if (isMissingTripVehicleColumn(insertResult.error)) {
      const { vehicle_type: _vehicleType, ...payloadWithoutVehicle } = legacyPayload;
      legacyPayload = payloadWithoutVehicle;
    }

    if (isMissingTripRecurrenceColumn(insertResult.error)) {
      const { recurrence_type: _recurrenceType, ...payloadWithoutRecurrence } = legacyPayload;
      legacyPayload = payloadWithoutRecurrence;
    }

    insertResult = await supabase.from("cargoo_trips").insert(legacyPayload).select("*").single();
  }

  const { data, error } = insertResult;

  if (isMissingCargooTable(error)) {
    const nextTrips = [
      {
        ...nextTrip,
        routeStops: routeCities.slice(1, -1),
        currentStopIndex: 0,
      },
      ...getMetadataTripRecords(user),
    ];
    await updateUserMetadata({ cargoo_trips: nextTrips });
    return nextTrip;
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  if (routeCities.length > 0) {
    const now = new Date().toISOString();
    const stopPayload = routeCities.map((city, index) => ({
      trip_id: data.id,
      stop_order: index,
      city,
      reached_at: index === 0 ? now : null,
    }));

    const { error: stopsError } = await supabase.from("cargoo_trip_stops").insert(stopPayload);

    if (!isMissingCargooTable(stopsError)) {
      const mappedStopsError = mapSupabaseError(stopsError);
      if (mappedStopsError) {
        throw mappedStopsError;
      }
    }
  }

  return mapTripRow(data);
};

export const getTripById = async (tripId: string) => {
  const user = await requireUser();
  const { data, error } = await supabase
    .from("cargoo_trips")
    .select("*")
    .eq("user_id", user.id)
    .eq("id", tripId)
    .maybeSingle();

  if (isMissingCargooTable(error)) {
    return getMetadataTripDetails(user, tripId);
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  if (!data) {
    return null;
  }

  const trip = mapTripRow(data);
  const { stops, trackingAvailable } = await getTripStopsFromSupabase(trip.id);

  return buildTripDetails(trip, stops ?? buildDefaultTripStops(trip), trackingAvailable);
};

export const advanceTripToNextStop = async (tripId: string) => {
  const user = await requireUser();
  const { error: tripTableError } = await supabase
    .from("cargoo_trips")
    .select("id")
    .eq("user_id", user.id)
    .eq("id", tripId)
    .maybeSingle();

  if (isMissingCargooTable(tripTableError)) {
    const metadataTripDetails = getMetadataTripDetails(user, tripId);
    if (!metadataTripDetails) {
      throw new Error("No encontramos ese viaje.");
    }

    return advanceMetadataTripToNextStop(user, metadataTripDetails);
  }

  const mappedTripTableError = mapSupabaseError(tripTableError);
  if (mappedTripTableError) {
    throw mappedTripTableError;
  }

  const tripDetails = await getTripById(tripId);

  if (!tripDetails) {
    throw new Error("No encontramos ese viaje.");
  }

  if (!tripDetails.trackingAvailable) {
    throw new Error("El seguimiento por ciudades aún no esta disponible en esta base de datos.");
  }

  const nextStop = tripDetails.nextStop;
  if (!nextStop) {
    return tripDetails;
  }

  const reachedAt = new Date().toISOString();
  const { error: stopUpdateError } = await supabase
    .from("cargoo_trip_stops")
    .update({ reached_at: reachedAt })
    .eq("id", nextStop.id);

  const mappedStopUpdateError = mapSupabaseError(stopUpdateError);
  if (mappedStopUpdateError) {
    throw mappedStopUpdateError;
  }

  void triggerPushEvent({
    eventType: "trip_checkpoint_reached",
    tripId,
    stopId: nextStop.id,
    city: nextStop.city,
  }).catch((error) => {
    console.error("No se pudo enviar la push del checkpoint.", error);
  });

  const isLastStop = nextStop.order === tripDetails.stops[tripDetails.stops.length - 1]?.order;

  const updatedTripDetails = isLastStop ? await syncTripCompletionState(user.id, tripId) : await getTripById(tripId);
  if (!updatedTripDetails) {
    throw new Error("No pudimos recargar el viaje despues del checkpoint.");
  }

  return updatedTripDetails;
};

export const getPublicTripListings = async () => {
  const { data: profiles, error: profilesError } = await supabase
    .from("cargoo_profiles")
    .select("user_id, name, avatar_url, location")
    .eq("is_public", true);

  if (isMissingCargooTable(profilesError)) {
    return [] as PublicTripListing[];
  }

  const mappedProfilesError = mapSupabaseError(profilesError);
  if (mappedProfilesError) {
    throw mappedProfilesError;
  }

  if (!profiles?.length) {
    return [];
  }

  const profileByUserId = new Map(
    profiles.map((profile) => [
      profile.user_id,
      {
        name: profile.name,
        avatarUrl: profile.avatar_url ?? "",
        location: normalizeOptionalLocation(profile.location),
      },
    ]),
  );

  const userIds = Array.from(profileByUserId.keys());
  const ratingSummaryByUserId = await getPublicTravelerRatingSummaries(userIds);
  const publicProfileByUserId = new Map(
    Array.from(profileByUserId.entries()).map(([userId, profile]) => [
      userId,
      {
        ...profile,
        averageRating: ratingSummaryByUserId.get(userId)?.averageRating ?? null,
        reviewsCount: ratingSummaryByUserId.get(userId)?.reviewsCount ?? 0,
      },
    ]),
  );
  const { data: trips, error: tripsError } = await supabase
    .from("cargoo_trips")
    .select("*")
    .in("user_id", userIds)
    .eq("status", "active")
    .order("trip_date", { ascending: true });

  if (isMissingCargooTable(tripsError)) {
    return [] as PublicTripListing[];
  }

  const mappedTripsError = mapSupabaseError(tripsError);
  if (mappedTripsError) {
    throw mappedTripsError;
  }

  const publicTrips = (trips ?? []).filter((trip) => profileByUserId.has(trip.user_id));
  const stopsByTripId = await getPublicTripStopsByTripIds(publicTrips.map((trip) => trip.id));
  const visibleTrips = publicTrips.filter((tripRow) => {
    const trip = mapTripRow(tripRow);
    const tripDetails = buildTripDetails(trip, stopsByTripId.get(trip.id) ?? buildDefaultTripStops(trip), true);
    return trip.recurrence !== "once" || Boolean(tripDetails.nextStop);
  });
  const tripCountByUserId = visibleTrips.reduce<Record<string, number>>((counts, trip) => {
    counts[trip.user_id] = (counts[trip.user_id] ?? 0) + 1;
    return counts;
  }, {});

  return visibleTrips.map((trip) =>
    buildPublicTripListing(trip, publicProfileByUserId.get(trip.user_id), tripCountByUserId[trip.user_id] ?? 1, stopsByTripId),
  );
};

const getPublicTravelerReviews = async (travelerId: string) => {
  const allReviews = await getTravelerReviews(travelerId);

  return {
    averageRating: allReviews.averageRating,
    reviewsCount: allReviews.reviewsCount,
    reviews: allReviews.reviews.filter((review) => Boolean(review.comment.trim())).slice(0, 6),
  } satisfies Pick<PublicCarrierProfile, "averageRating" | "reviewsCount" | "reviews">;
};

export const getPublicCarrierProfile = async (userId: string) => {
  const { data: profile, error: profileError } = await supabase
    .from("cargoo_profiles")
    .select("user_id, name, avatar_url, is_traveler, locale, location, bio, phone")
    .eq("user_id", userId)
    .eq("is_public", true)
    .maybeSingle();

  if (isMissingCargooTable(profileError)) {
    return null as PublicCarrierProfile | null;
  }

  const mappedProfileError = mapSupabaseError(profileError);
  if (mappedProfileError) {
    throw mappedProfileError;
  }

  if (!profile) {
    return null;
  }

  const { data: trips, error: tripsError } = await supabase
    .from("cargoo_trips")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("trip_date", { ascending: true });

  if (isMissingCargooTable(tripsError)) {
    return null as PublicCarrierProfile | null;
  }

  const mappedTripsError = mapSupabaseError(tripsError);
  if (mappedTripsError) {
    throw mappedTripsError;
  }

  const upcomingTrips = trips ?? [];
  const stopsByTripId = await getPublicTripStopsByTripIds(upcomingTrips.map((trip) => trip.id));
  const publicReviews = await getPublicTravelerReviews(userId);
  const visibleTrips = upcomingTrips.filter((tripRow) => {
    const trip = mapTripRow(tripRow);
    const tripDetails = buildTripDetails(trip, stopsByTripId.get(trip.id) ?? buildDefaultTripStops(trip), true);
    return trip.recurrence !== "once" || Boolean(tripDetails.nextStop);
  });
  const tripsCount = visibleTrips.length;

  return {
    userId: profile.user_id,
    name: profile.name,
    avatarUrl: profile.avatar_url ?? "",
    location: normalizeOptionalLocation(profile.location),
    bio: normalizeProfileBio(profile.bio, profile.is_traveler, profile.locale ? normalizeLocale(profile.locale) : "es"),
    phone: profile.phone ?? "",
    isTraveler: profile.is_traveler,
    averageRating: publicReviews.averageRating,
    reviewsCount: publicReviews.reviewsCount,
    reviews: publicReviews.reviews,
    trips: visibleTrips.map((trip) =>
      buildPublicTripListing(
        trip,
        {
          name: profile.name,
          avatarUrl: profile.avatar_url ?? "",
          location: normalizeOptionalLocation(profile.location),
          averageRating: publicReviews.averageRating,
          reviewsCount: publicReviews.reviewsCount,
        },
        tripsCount,
        stopsByTripId,
      ),
    ),
  } satisfies PublicCarrierProfile;
};

const getShipmentsByConversationIds = async (conversationIds: string[]) => {
  if (isShipmentFeatureUnavailable()) {
    return new Map<string, ShipmentRow>();
  }

  if (!conversationIds.length) {
    return new Map<string, ShipmentRow>();
  }

  const { data, error } = await supabase
    .from("cargoo_shipments")
    .select("*")
    .in("conversation_id", conversationIds);

  if (isMissingCargooTable(error)) {
    markShipmentFeatureUnavailable();
    return new Map<string, ShipmentRow>();
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  markShipmentFeatureAvailable();
  return new Map((data ?? []).map((shipment) => [shipment.conversation_id, shipment] as const));
};

const buildShipmentSummaries = async (rows: ShipmentRow[]) => {
  const [tripDetailsById, travelerPhonesByUserId] = await Promise.all([
    getAccessibleTripDetailsByIds(Array.from(new Set(rows.map((row) => row.trip_id)))),
    getProfilePhonesByUserIds(rows.map((row) => row.traveler_id)),
  ]);

  return rows.map((row) => buildShipmentSummary(row, tripDetailsById.get(row.trip_id) ?? null, travelerPhonesByUserId.get(row.traveler_id) ?? ""));
};

const getShipmentByIdInternal = async (shipmentId: string) => {
  if (isShipmentFeatureUnavailable()) {
    return null as ShipmentSummary | null;
  }

  const { data, error } = await supabase.from("cargoo_shipments").select("*").eq("id", shipmentId).maybeSingle();

  if (isMissingCargooTable(error)) {
    markShipmentFeatureUnavailable();
    return null as ShipmentSummary | null;
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  markShipmentFeatureAvailable();

  if (!data) {
    return null;
  }

  const [shipment] = await buildShipmentSummaries([data]);
  return shipment ?? null;
};

export const getMyShipments = async () => {
  if (isShipmentFeatureUnavailable()) {
    return [] as ShipmentSummary[];
  }

  const user = await requireUser();
  const { data, error } = await supabase
    .from("cargoo_shipments")
    .select("*")
    .eq("sender_id", user.id)
    .order("created_at", { ascending: false });

  if (isMissingCargooTable(error)) {
    markShipmentFeatureUnavailable();
    return [] as ShipmentSummary[];
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  markShipmentFeatureAvailable();
  return buildShipmentSummaries(data ?? []);
};

export const deleteDeliveredShipment = async (shipmentId: string) => {
  if (isShipmentFeatureUnavailable()) {
    throw new Error("Los envíos aún no estan disponibles en esta base de datos.");
  }

  const user = await requireUser();
  const { data, error } = await supabase
    .from("cargoo_shipments")
    .select("id, status, sender_id, traveler_id")
    .eq("id", shipmentId)
    .maybeSingle();

  if (isMissingCargooTable(error)) {
    markShipmentFeatureUnavailable();
    throw new Error("Los envíos aún no estan disponibles en esta base de datos.");
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  if (!data || (data.sender_id !== user.id && data.traveler_id !== user.id)) {
    throw new Error("No encontramos ese envío.");
  }

  if (data.status !== "delivered") {
    throw new Error("Solo puedes eliminar envíos entregados.");
  }

  const { error: deleteError } = await supabase.from("cargoo_shipments").delete().eq("id", shipmentId);
  const mappedDeleteError = mapSupabaseError(deleteError);
  if (mappedDeleteError) {
    throw mappedDeleteError;
  }

  markShipmentFeatureAvailable();
};

export const getTripShipments = async (tripId: string) => {
  if (isShipmentFeatureUnavailable()) {
    return [] as ShipmentSummary[];
  }

  const { data, error } = await supabase
    .from("cargoo_shipments")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });

  if (isMissingCargooTable(error)) {
    markShipmentFeatureUnavailable();
    return [] as ShipmentSummary[];
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  markShipmentFeatureAvailable();
  return buildShipmentSummaries(data ?? []);
};

export const createShipmentRequest = async (conversationId: string) => {
  if (isShipmentFeatureUnavailable()) {
    throw new Error("Los envíos aún no estan disponibles en esta base de datos.");
  }

  const user = await requireUser();
  const profile = await ensureProfile(user);
  const { data: conversation, error: conversationError } = await supabase
    .from("cargoo_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (isMissingCargooTable(conversationError)) {
    markShipmentFeatureUnavailable();
    throw new Error("Los envíos aún no estan disponibles en esta base de datos.");
  }

  const mappedConversationError = mapSupabaseError(conversationError);
  if (mappedConversationError) {
    throw mappedConversationError;
  }

  if (!conversation?.trip_id) {
    throw new Error("Este chat no esta vinculado a un viaje publicado.");
  }

  if (conversation.participant_one_is_traveler && conversation.participant_one_id === user.id) {
    throw new Error("Solo el emisor puede elegir este transporte desde el chat.");
  }

  if (conversation.participant_two_is_traveler && conversation.participant_two_id === user.id) {
    throw new Error("Solo el emisor puede elegir este transporte desde el chat.");
  }

  const { data: existingShipment, error: existingShipmentError } = await supabase
    .from("cargoo_shipments")
    .select("id")
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (!isMissingCargooTable(existingShipmentError)) {
    const mappedExistingShipmentError = mapSupabaseError(existingShipmentError);
    if (mappedExistingShipmentError) {
      throw mappedExistingShipmentError;
    }
  } else {
    markShipmentFeatureUnavailable();
    throw new Error("Los envíos aún no estan disponibles en esta base de datos.");
  }

  if (existingShipment?.id) {
    const shipment = await getShipmentByIdInternal(existingShipment.id);
    if (!shipment) {
      throw new Error("No pudimos recuperar el envío ya creado.");
    }

    return shipment;
  }

  const isParticipantOneSender = conversation.participant_one_id === user.id;
  const travelerId = isParticipantOneSender ? conversation.participant_two_id : conversation.participant_one_id;
  const travelerName = isParticipantOneSender ? conversation.participant_two_name : conversation.participant_one_name;

  const { data, error } = await supabase
    .from("cargoo_shipments")
    .insert({
      trip_id: conversation.trip_id,
      conversation_id: conversation.id,
      sender_id: user.id,
      sender_name: profile.name,
      traveler_id: travelerId,
      traveler_name: travelerName,
      route_origin: conversation.route_origin?.trim() || "Origen por confirmar",
      route_destination: conversation.route_destination?.trim() || "Destino por confirmar",
      status: "pending",
    })
    .select("*")
    .single();

  if (isMissingCargooTable(error)) {
    markShipmentFeatureUnavailable();
    throw new Error("Los envíos aún no estan disponibles en esta base de datos.");
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  markShipmentFeatureAvailable();
  const [shipment] = await buildShipmentSummaries([data]);
  return shipment;
};

export const markConversationPackageLoaded = async (conversationId: string) => {
  if (isShipmentFeatureUnavailable()) {
    throw new Error("Los envíos aún no estan disponibles en esta base de datos.");
  }

  const user = await requireUser();
  const { data: conversation, error: conversationError } = await supabase
    .from("cargoo_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (isMissingCargooTable(conversationError)) {
    markShipmentFeatureUnavailable();
    throw new Error("Los envíos aún no estan disponibles en esta base de datos.");
  }

  const mappedConversationError = mapSupabaseError(conversationError);
  if (mappedConversationError) {
    throw mappedConversationError;
  }

  if (!conversation?.trip_id) {
    throw new Error("Este chat no esta vinculado a un viaje publicado.");
  }

  const currentUserIsParticipantOne = conversation.participant_one_id === user.id;
  const currentUserIsTraveler = currentUserIsParticipantOne
    ? conversation.participant_one_is_traveler
    : conversation.participant_two_id === user.id
      ? conversation.participant_two_is_traveler
      : false;

  if (currentUserIsTraveler) {
    throw new Error("El emisor es quien confirma cuando el paquete ya esta cargado.");
  }

  const { data: existingShipment, error: existingShipmentError } = await supabase
    .from("cargoo_shipments")
    .select("id")
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (isMissingCargooTable(existingShipmentError)) {
    markShipmentFeatureUnavailable();
    throw new Error("Los envíos aún no estan disponibles en esta base de datos.");
  }

  const mappedExistingShipmentError = mapSupabaseError(existingShipmentError);
  if (mappedExistingShipmentError) {
    throw mappedExistingShipmentError;
  }

  if (existingShipment?.id) {
    const shipment = await getShipmentByIdInternal(existingShipment.id);
    if (!shipment) {
      throw new Error("No pudimos recuperar el envío ya creado.");
    }

    if (shipment.status === "accepted" || shipment.status === "delivered") {
      return shipment;
    }

    const { error: updateError } = await supabase
      .from("cargoo_shipments")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", shipment.id)
      .eq("sender_id", user.id);

    const mappedUpdateError = mapSupabaseError(updateError);
    if (mappedUpdateError) {
      throw mappedUpdateError;
    }

    const updatedShipment = await getShipmentByIdInternal(shipment.id);
    if (!updatedShipment) {
      throw new Error("No pudimos recargar el envío cargado.");
    }

    return updatedShipment;
  }

  const travelerId = conversation.participant_one_is_traveler ? conversation.participant_one_id : conversation.participant_two_id;
  const travelerName = conversation.participant_one_is_traveler ? conversation.participant_one_name : conversation.participant_two_name;
  const senderId = conversation.participant_one_is_traveler ? conversation.participant_two_id : conversation.participant_one_id;
  const senderName = conversation.participant_one_is_traveler ? conversation.participant_two_name : conversation.participant_one_name;

  const { data, error } = await supabase
    .from("cargoo_shipments")
    .insert({
      trip_id: conversation.trip_id,
      conversation_id: conversation.id,
      sender_id: senderId,
      sender_name: senderName,
      traveler_id: travelerId,
      traveler_name: travelerName,
      route_origin: conversation.route_origin?.trim() || "Origen por confirmar",
      route_destination: conversation.route_destination?.trim() || "Destino por confirmar",
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (isMissingCargooTable(error)) {
    markShipmentFeatureUnavailable();
    throw new Error("Los envíos aún no estan disponibles en esta base de datos.");
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  markShipmentFeatureAvailable();
  const [shipment] = await buildShipmentSummaries([data]);
  return shipment;
};

export const acceptShipment = async (shipmentId: string) => {
  const user = await requireUser();
  const shipment = await getShipmentByIdInternal(shipmentId);

  if (!shipment) {
    throw new Error("No encontramos ese envío.");
  }

  if (shipment.travelerId !== user.id) {
    throw new Error("Solo el transportista puede aceptar este envío.");
  }

  if (shipment.status !== "pending") {
    return shipment;
  }

  const { error } = await supabase
    .from("cargoo_shipments")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", shipmentId)
    .eq("traveler_id", user.id);

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  const updatedShipment = await getShipmentByIdInternal(shipmentId);
  if (!updatedShipment) {
    throw new Error("No pudimos recargar el envío aceptado.");
  }

  return updatedShipment;
};

export const markShipmentDelivered = async (shipmentId: string) => {
  const user = await requireUser();
  const shipment = await getShipmentByIdInternal(shipmentId);

  if (!shipment) {
    throw new Error("No encontramos ese envío.");
  }

  if (shipment.travelerId !== user.id) {
    throw new Error("Solo el transportista puede marcar el paquete como entregado.");
  }

  if (shipment.status === "delivered") {
    return shipment;
  }

  if (shipment.status !== "accepted") {
    throw new Error("Primero debes aceptar el envío antes de marcarlo como entregado.");
  }

  const { error } = await supabase
    .from("cargoo_shipments")
    .update({ status: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", shipmentId)
    .eq("traveler_id", user.id);

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  void triggerPushEvent({
    eventType: "shipment_delivered",
    shipmentId,
  }).catch((error) => {
    console.error("No se pudo enviar la push de paquete entregado.", error);
  });

  await syncTripCompletionState(user.id, shipment.tripId);

  const updatedShipment = await getShipmentByIdInternal(shipmentId);
  if (!updatedShipment) {
    throw new Error("No pudimos recargar el envío entregado.");
  }

  return updatedShipment;
};

export const submitShipmentReview = async ({ shipmentId, rating, comment }: SubmitShipmentReviewInput) => {
  const user = await requireUser();
  const shipment = await getShipmentByIdInternal(shipmentId);

  if (!shipment) {
    throw new Error("No encontramos ese envío.");
  }

  if (shipment.senderId !== user.id) {
    throw new Error("Solo el emisor puede valorar este envío.");
  }

  if (shipment.status !== "delivered") {
    throw new Error("Solo puedes valorar envíos ya entregados.");
  }

  if (shipment.reviewRating) {
    throw new Error("Este envío ya tiene una valoracion registrada.");
  }

  const cleanComment = comment.trim();
  const normalizedRating = Math.min(Math.max(Math.round(rating), 1), 5);
  const { error } = await supabase
    .from("cargoo_shipments")
    .update({
      review_rating: normalizedRating,
      review_comment: cleanComment || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", shipmentId)
    .eq("sender_id", user.id);

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  const updatedShipment = await getShipmentByIdInternal(shipmentId);
  if (!updatedShipment) {
    throw new Error("No pudimos recargar la valoracion.");
  }

  return updatedShipment;
};

export const getTravelerRatingSummary = async (travelerId: string) => {
  if (isShipmentFeatureUnavailable()) {
    return {
      averageRating: null,
      reviewsCount: 0,
    } satisfies TravelerRatingSummary;
  }

  const { data, error } = await supabase
    .from("cargoo_shipments")
    .select("review_rating")
    .eq("traveler_id", travelerId)
    .not("review_rating", "is", null);

  if (isMissingCargooTable(error)) {
    markShipmentFeatureUnavailable();
    return {
      averageRating: null,
      reviewsCount: 0,
    } satisfies TravelerRatingSummary;
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  markShipmentFeatureAvailable();
  const ratings = (data ?? []).map((item) => item.review_rating).filter((rating): rating is number => typeof rating === "number");

  if (!ratings.length) {
    return {
      averageRating: null,
      reviewsCount: 0,
    } satisfies TravelerRatingSummary;
  }

  return {
    averageRating: Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)),
    reviewsCount: ratings.length,
  } satisfies TravelerRatingSummary;
};

export const getTravelerReviews = async (travelerId: string) => {
  if (isShipmentFeatureUnavailable()) {
    return {
      averageRating: null,
      reviewsCount: 0,
      reviews: [],
    } satisfies TravelerReviewsResult;
  }

  const { data, error } = await supabase
    .from("cargoo_shipments")
    .select("id, sender_name, review_rating, review_comment, reviewed_at, route_origin, route_destination")
    .eq("traveler_id", travelerId)
    .eq("status", "delivered")
    .not("review_rating", "is", null)
    .order("reviewed_at", { ascending: false });

  if (isMissingCargooTable(error)) {
    markShipmentFeatureUnavailable();
    return {
      averageRating: null,
      reviewsCount: 0,
      reviews: [],
    } satisfies TravelerReviewsResult;
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  markShipmentFeatureAvailable();
  const ratings = (data ?? []).map((item) => item.review_rating).filter((rating): rating is number => typeof rating === "number");
  const reviews = (data ?? []).map((item) => ({
    id: item.id,
    senderName: item.sender_name,
    rating: item.review_rating as number,
    comment: item.review_comment?.trim() ?? "",
    reviewedAt: item.reviewed_at,
    routeOrigin: item.route_origin,
    routeDestination: item.route_destination,
  }));

  return {
    averageRating: ratings.length ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)) : null,
    reviewsCount: ratings.length,
    reviews,
  } satisfies TravelerReviewsResult;
};

export const getConversations = async () => {
  if (isChatFeatureUnavailable()) {
    return [] as ConversationSummary[];
  }

  const user = await requireUser();
  const { data: conversations, error: conversationsError } = await supabase
    .from("cargoo_conversations")
    .select("*")
    .or(`participant_one_id.eq.${user.id},participant_two_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  if (isMissingCargooTable(conversationsError)) {
    markChatFeatureUnavailable();
    return [] as ConversationSummary[];
  }

  const mappedConversationsError = mapSupabaseError(conversationsError);
  if (mappedConversationsError) {
    throw mappedConversationsError;
  }

  markChatFeatureAvailable();

  if (!conversations?.length) {
    return [];
  }

  const conversationIds = conversations.map((conversation) => conversation.id);
  const hiddenStatesByConversationId = await getHiddenConversationStatesForUser(user.id, conversationIds);
  const visibleConversations = conversations.filter((conversation) => {
    const hiddenState = hiddenStatesByConversationId.get(conversation.id);
    if (!hiddenState) {
      return true;
    }

    const lastActivityAt = conversation.last_message_at ?? conversation.created_at ?? new Date().toISOString();
    return new Date(lastActivityAt).getTime() > new Date(hiddenState.hidden_at).getTime();
  });

  if (!visibleConversations.length) {
    return [];
  }

  const visibleConversationIds = visibleConversations.map((conversation) => conversation.id);
  const otherUserIds = visibleConversations.map((conversation) =>
    conversation.participant_one_id === user.id ? conversation.participant_two_id : conversation.participant_one_id,
  );
  const shipmentByConversationId = await getShipmentsByConversationIds(visibleConversationIds);
  const avatarUrlByUserId = await getProfileAvatarUrlsByUserIds(otherUserIds);
  const { data: unreadMessages, error: unreadMessagesError } = await supabase
    .from("cargoo_messages")
    .select("conversation_id")
    .in("conversation_id", visibleConversationIds)
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (isMissingCargooTable(unreadMessagesError)) {
    markChatFeatureUnavailable();
    return visibleConversations.map((conversation) => mapConversationRow(conversation, user.id));
  }

  const mappedUnreadMessagesError = mapSupabaseError(unreadMessagesError);
  if (mappedUnreadMessagesError) {
    throw mappedUnreadMessagesError;
  }

  const unreadCountByConversationId = (unreadMessages ?? []).reduce<Record<string, number>>((counts, message) => {
    counts[message.conversation_id] = (counts[message.conversation_id] ?? 0) + 1;
    return counts;
  }, {});

  return visibleConversations.map((conversation) =>
    mapConversationRow(
      conversation,
      user.id,
      unreadCountByConversationId[conversation.id] ?? 0,
      shipmentByConversationId.get(conversation.id) ?? null,
      avatarUrlByUserId.get(conversation.participant_one_id === user.id ? conversation.participant_two_id : conversation.participant_one_id) ?? "",
    ),
  );
};

export const getConversationMessages = async (conversationId: string) => {
  if (isChatFeatureUnavailable()) {
    return null as { conversation: ConversationSummary; messages: ChatMessage[]; shipment: ShipmentSummary | null } | null;
  }

  const user = await requireUser();
  const { data: conversation, error: conversationError } = await supabase
    .from("cargoo_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (isMissingCargooTable(conversationError)) {
    markChatFeatureUnavailable();
    return null as { conversation: ConversationSummary; messages: ChatMessage[]; shipment: ShipmentSummary | null } | null;
  }

  const mappedConversationError = mapSupabaseError(conversationError);
  if (mappedConversationError) {
    throw mappedConversationError;
  }

  markChatFeatureAvailable();

  if (!conversation) {
    return null;
  }

  const { data: messages, error: messagesError } = await supabase
    .from("cargoo_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (isMissingCargooTable(messagesError)) {
    markChatFeatureUnavailable();
    return null as { conversation: ConversationSummary; messages: ChatMessage[]; shipment: ShipmentSummary | null } | null;
  }

  const mappedMessagesError = mapSupabaseError(messagesError);
  if (mappedMessagesError) {
    throw mappedMessagesError;
  }

  const unreadCount = (messages ?? []).filter((message) => message.sender_id !== user.id && !message.read_at).length;
  const shipmentByConversationId = await getShipmentsByConversationIds([conversationId]);
  const shipmentRow = shipmentByConversationId.get(conversationId) ?? null;
  const shipment = shipmentRow ? (await buildShipmentSummaries([shipmentRow]))[0] ?? null : null;
  const otherUserId = conversation.participant_one_id === user.id ? conversation.participant_two_id : conversation.participant_one_id;
  const avatarUrlByUserId = await getProfileAvatarUrlsByUserIds([otherUserId]);

  return {
    conversation: mapConversationRow(
      conversation,
      user.id,
      unreadCount,
      shipmentRow,
      avatarUrlByUserId.get(otherUserId) ?? "",
    ),
    messages: (messages ?? []).map(mapMessageRow),
    shipment,
  };
};

export const markConversationAsRead = async (conversationId: string) => {
  if (isChatFeatureUnavailable()) {
    return;
  }

  const user = await requireUser();
  const { error } = await supabase
    .from("cargoo_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }
};

export const hideConversationForMe = async (conversationId: string) => {
  if (isChatFeatureUnavailable()) {
    throw new Error("El chat aún no esta disponible en esta base de datos.");
  }

  const user = await requireUser();
  const { data, error } = await supabase
    .from("cargoo_conversations")
    .select("id, participant_one_id, participant_two_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (isMissingCargooTable(error)) {
    markChatFeatureUnavailable();
    throw new Error("El chat aún no esta disponible en esta base de datos.");
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  if (!data) {
    throw new Error("No encontramos esa conversacion.");
  }

  if (data.participant_one_id !== user.id && data.participant_two_id !== user.id) {
    throw new Error("No tienes acceso a esa conversacion.");
  }

  const { error: hideError } = await supabase
    .from("cargoo_conversation_hidden_states")
    .upsert(
      {
        conversation_id: conversationId,
        user_id: user.id,
        hidden_at: new Date().toISOString(),
      },
      { onConflict: "conversation_id,user_id" },
    );

  if (isMissingCargooTable(hideError)) {
    throw new Error("La base de datos aún no tiene disponible la opcion de eliminar conversaciones solo para ti.");
  }

  const mappedHideError = mapSupabaseError(hideError);
  if (mappedHideError) {
    throw mappedHideError;
  }

  markChatFeatureAvailable();
};

export const getOrCreateConversation = async (input: CreateConversationInput) => {
  if (isChatFeatureUnavailable()) {
    throw new Error("El chat aún no esta disponible en esta base de datos.");
  }

  const user = await requireUser();
  const currentProfile = await ensureProfile(user);
  const normalizedTripId = input.tripId ?? null;
  const buildConversationLookup = () =>
    supabase
      .from("cargoo_conversations")
      .select("*")
      .or(
        `and(participant_one_id.eq.${user.id},participant_two_id.eq.${input.otherUserId}),and(participant_one_id.eq.${input.otherUserId},participant_two_id.eq.${user.id})`,
      );

  const { data: existingConversation, error: existingConversationError } = await (normalizedTripId
    ? buildConversationLookup().eq("trip_id", normalizedTripId).maybeSingle()
    : buildConversationLookup().is("trip_id", null).maybeSingle());

  if (!isMissingCargooTable(existingConversationError)) {
    const mappedExistingConversationError = mapSupabaseError(existingConversationError);
    if (mappedExistingConversationError) {
      throw mappedExistingConversationError;
    }
  }

  if (existingConversation) {
    return mapConversationRow(existingConversation, user.id);
  }

  const { data, error } = await supabase
    .from("cargoo_conversations")
    .insert({
      trip_id: normalizedTripId,
      participant_one_id: user.id,
      participant_one_name: currentProfile.name,
      participant_one_is_traveler: currentProfile.isTraveler,
      participant_two_id: input.otherUserId,
      participant_two_name: input.otherUserName,
      participant_two_is_traveler: input.otherUserIsTraveler,
      route_origin: input.routeOrigin?.trim() || null,
      route_destination: input.routeDestination?.trim() || null,
    })
    .select("*")
    .single();

  if (error?.code === "23505") {
    const { data: retryConversation, error: retryConversationError } = await (normalizedTripId
      ? buildConversationLookup().eq("trip_id", normalizedTripId).maybeSingle()
      : buildConversationLookup().is("trip_id", null).maybeSingle());

    const mappedRetryConversationError = mapSupabaseError(retryConversationError);
    if (mappedRetryConversationError) {
      throw mappedRetryConversationError;
    }

    if (retryConversation) {
      return mapConversationRow(retryConversation, user.id);
    }
  }

  if (isMissingCargooTable(error)) {
    markChatFeatureUnavailable();
    throw new Error("El chat aún no esta disponible en esta base de datos.");
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  markChatFeatureAvailable();

  return mapConversationRow(data, user.id);
};

export const sendConversationMessage = async (conversationId: string, content: string) => {
  if (isChatFeatureUnavailable()) {
    throw new Error("El chat aún no esta disponible en esta base de datos.");
  }

  const user = await requireUser();
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("Escribe un mensaje antes de enviarlo.");
  }

  const { data, error } = await supabase
    .from("cargoo_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmedContent,
    })
    .select("*")
    .single();

  if (isMissingCargooTable(error)) {
    markChatFeatureUnavailable();
    throw new Error("El chat aún no esta disponible en esta base de datos.");
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  markChatFeatureAvailable();

  void triggerPushEvent({
    eventType: "message_received",
    messageId: data.id,
  }).catch((error) => {
    console.error("No se pudo enviar la push de nuevo mensaje.", error);
  });

  return mapMessageRow(data);
};

export const getTripStats = (trips: CargooTrip[]) => {
  const activeTrips = trips.filter((trip) => trip.status === "active");

  return {
    totalTrips: trips.length,
    activeTrips: activeTrips.length,
    pendingRequests: activeTrips.reduce((sum, trip) => sum + trip.requests, 0),
    totalCapacityKg: activeTrips.reduce((sum, trip) => sum + trip.capacityKg, 0),
  };
};

export const getFriendlyErrorMessage = (error: unknown) => getErrorMessage(error);
