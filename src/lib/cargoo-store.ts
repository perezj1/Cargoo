import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export interface CargooUser {
  userId: string;
  name: string;
  email: string;
  isTraveler: boolean;
  isPublic: boolean;
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
  carrierLocation: string;
  origin: string;
  destination: string;
  date: string;
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
  location: string;
  bio: string;
  phone: string;
  isTraveler: boolean;
  trips: PublicTripListing[];
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
  routeOrigin: string;
  routeDestination: string;
  tripDate: string;
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
}

interface CreateTripInput {
  origin: string;
  destination: string;
  date: string;
  capacityKg: number;
  notes: string;
  routeStops?: string[];
}

type MetadataRecord = Record<string, unknown>;

const DEFAULT_LOCATION = "Madrid, Espana";
const DEFAULT_BIO = "Conductor habitual con espacio disponible para mover paquetes entre ciudades.";
let chatFeatureAvailable: boolean | null = null;
let shipmentFeatureAvailable: boolean | null = null;

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

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

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
): CargooTrip["status"] => {
  if (persistedStatus === "completed") {
    return "completed";
  }

  if (persistedStatus === "active") {
    return "active";
  }

  return parseDateInput(date) < parseDateInput(getTodayDateString()) ? "completed" : "active";
};

const getTripStatusFromDate = (date: string): CargooTrip["status"] => {
  return resolveTripStatus(date);
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

  return {
    userId: user.id,
    name: typeof metadata.name === "string" && metadata.name.trim() ? metadata.name : deriveNameFromEmail(user.email ?? ""),
    email: user.email ?? "",
    isTraveler: Boolean(metadata.is_traveler),
    isPublic: metadata.is_public === false ? false : true,
    avatarUrl: typeof metadata.avatar_url === "string" ? metadata.avatar_url : "",
    phone: typeof metadata.phone === "string" ? metadata.phone : "",
    location: typeof metadata.location === "string" && metadata.location.trim() ? metadata.location : DEFAULT_LOCATION,
    bio: typeof metadata.bio === "string" && metadata.bio.trim() ? metadata.bio : DEFAULT_BIO,
  };
};

const profileToMetadata = (profile: CargooUser) => ({
  name: profile.name,
  is_traveler: profile.isTraveler,
  is_public: profile.isPublic,
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
        capacityKg: item.capacityKg,
        usedKg: item.usedKg,
        requests: item.requests,
        notes: item.notes,
        status: resolveTripStatus(item.date, item.status),
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
    throw new Error("No se pudo actualizar la sesion de usuario.");
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
    throw new Error("No hay una sesion activa.");
  }

  return user;
};

const mapProfileRow = (
  row: {
    user_id: string;
    name: string;
    is_traveler: boolean;
    is_public: boolean;
    avatar_url?: string | null;
    phone?: string | null;
    location?: string | null;
    bio?: string | null;
  },
  email: string,
  fallbackAvatarUrl = "",
): CargooUser => ({
  userId: row.user_id,
  name: row.name,
  email,
  isTraveler: row.is_traveler,
  isPublic: row.is_public,
  avatarUrl: row.avatar_url ?? fallbackAvatarUrl,
  phone: row.phone ?? "",
  location: row.location ?? DEFAULT_LOCATION,
  bio: row.bio ?? DEFAULT_BIO,
});

const mapTripRow = (row: {
  id: string;
  origin: string;
  destination: string;
  trip_date: string;
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
  capacityKg: row.capacity_kg,
  usedKg: row.used_kg,
  requests: row.requests,
  notes: row.notes ?? "",
  status: resolveTripStatus(row.trip_date, row.status),
  createdAt: row.created_at ?? new Date().toISOString(),
});

type ConversationRow = Database["public"]["Tables"]["cargoo_conversations"]["Row"];
type MessageRow = Database["public"]["Tables"]["cargoo_messages"]["Row"];
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
    capacity_kg: number;
    used_kg: number;
    notes: string | null;
  },
  profile: {
    name: string;
    location: string;
  } | undefined,
  tripsCount: number,
  stopsByTripId: Map<string, CargooTripStop[]>,
): PublicTripListing => {
  const routeCities = getPublicRouteCities(trip, stopsByTripId);

  return {
    id: trip.id,
    userId: trip.user_id,
    carrierName: profile?.name ?? "Conductor Cargoo",
    carrierLocation: profile?.location ?? DEFAULT_LOCATION,
    origin: trip.origin,
    destination: trip.destination,
    date: trip.trip_date,
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
    lastMessageText: row.last_message_text ?? "Sin mensajes todavia.",
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

const buildShipmentSummary = (
  row: ShipmentRow,
  tripDetails: CargooTripDetails | null,
): ShipmentSummary => ({
  id: row.id,
  tripId: row.trip_id,
  conversationId: row.conversation_id,
  senderId: row.sender_id,
  senderName: row.sender_name,
  travelerId: row.traveler_id,
  travelerName: row.traveler_name,
  routeOrigin: row.route_origin,
  routeDestination: row.route_destination,
  tripDate: tripDetails?.date ?? "",
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
    is_traveler: profile.isTraveler,
    is_public: profile.isPublic,
    avatar_url: profile.avatarUrl,
    phone: profile.phone,
    location: profile.location,
    bio: profile.bio,
  };
};

const upsertProfilePayload = async (payload: ReturnType<typeof buildProfilePayload>) => {
  const result = await supabase.from("cargoo_profiles").upsert(payload, { onConflict: "user_id" }).select("*").single();

  if (!isMissingProfileAvatarColumn(result.error)) {
    return result;
  }

  const { avatar_url: _avatarUrl, ...payloadWithoutAvatar } = payload;
  return supabase.from("cargoo_profiles").upsert(payloadWithoutAvatar, { onConflict: "user_id" }).select("*").single();
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

    return mapProfileRow(data, user.email ?? "", buildProfileFromMetadata(user).avatarUrl);
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

  return mapProfileRow(createdProfile, user.email ?? "", buildProfileFromMetadata(user).avatarUrl);
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
    throw new Error("No se pudo iniciar sesion.");
  }

  return ensureProfile(data.user);
};

export const registerUser = async ({ name, email, password, isTraveler, isPublic }: RegisterUserInput) => {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        name,
        is_traveler: isTraveler,
        is_public: isPublic,
        phone: "",
        location: DEFAULT_LOCATION,
        bio: DEFAULT_BIO,
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
  };

  const nextUser = await updateUserMetadata({
    name: nextProfile.name,
    is_traveler: nextProfile.isTraveler,
    is_public: nextProfile.isPublic,
    phone: nextProfile.phone,
    location: nextProfile.location,
    bio: nextProfile.bio,
  });

  const payload = {
    user_id: nextUser.id,
    name: nextProfile.name,
    is_traveler: nextProfile.isTraveler,
    is_public: nextProfile.isPublic,
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

  return mapProfileRow(data, nextProfile.email, nextProfile.avatarUrl);
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

  return mapProfileRow(data, nextUser.email ?? "", avatarUrl);
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
  const normalizedOrigin = trip.origin.trim();
  const normalizedDestination = trip.destination.trim();
  const normalizedNotes = trip.notes.trim() || "Sin notas adicionales.";
  const nextStatus = getTripStatusFromDate(trip.date);
  const routeCities = buildRouteCities(normalizedOrigin, normalizedDestination, trip.routeStops ?? []);
  const nextTrip: CargooTrip = {
    id: `trip-${Date.now()}`,
    origin: normalizedOrigin,
    destination: normalizedDestination,
    date: trip.date,
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
    capacity_kg: nextTrip.capacityKg,
    used_kg: nextTrip.usedKg,
    requests: nextTrip.requests,
    notes: normalizedNotes,
    status: nextStatus,
  };

  const { data, error } = await supabase.from("cargoo_trips").insert(payload).select("*").single();

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
    throw new Error("El seguimiento por ciudades aun no esta disponible en esta base de datos.");
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
    .select("user_id, name, location")
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
        location: profile.location ?? DEFAULT_LOCATION,
      },
    ]),
  );

  const userIds = Array.from(profileByUserId.keys());
  const { data: trips, error: tripsError } = await supabase
    .from("cargoo_trips")
    .select("*")
    .in("user_id", userIds)
    .eq("status", "active")
    .gte("trip_date", getTodayDateString())
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
    return Boolean(tripDetails.nextStop);
  });
  const tripCountByUserId = visibleTrips.reduce<Record<string, number>>((counts, trip) => {
    counts[trip.user_id] = (counts[trip.user_id] ?? 0) + 1;
    return counts;
  }, {});

  return visibleTrips.map((trip) =>
    buildPublicTripListing(trip, profileByUserId.get(trip.user_id), tripCountByUserId[trip.user_id] ?? 1, stopsByTripId),
  );
};

export const getPublicCarrierProfile = async (userId: string) => {
  const { data: profile, error: profileError } = await supabase
    .from("cargoo_profiles")
    .select("user_id, name, is_traveler, location, bio, phone")
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
    .gte("trip_date", getTodayDateString())
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
  const visibleTrips = upcomingTrips.filter((tripRow) => {
    const trip = mapTripRow(tripRow);
    const tripDetails = buildTripDetails(trip, stopsByTripId.get(trip.id) ?? buildDefaultTripStops(trip), true);
    return Boolean(tripDetails.nextStop);
  });
  const tripsCount = visibleTrips.length;

  return {
    userId: profile.user_id,
    name: profile.name,
    location: profile.location ?? DEFAULT_LOCATION,
    bio: profile.bio ?? DEFAULT_BIO,
    phone: profile.phone ?? "",
    isTraveler: profile.is_traveler,
    trips: visibleTrips.map((trip) =>
      buildPublicTripListing(
        trip,
        {
          name: profile.name,
          location: profile.location ?? DEFAULT_LOCATION,
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
  const tripDetailsById = await getAccessibleTripDetailsByIds(Array.from(new Set(rows.map((row) => row.trip_id))));
  return rows.map((row) => buildShipmentSummary(row, tripDetailsById.get(row.trip_id) ?? null));
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
    throw new Error("Los envios aun no estan disponibles en esta base de datos.");
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
    throw new Error("Los envios aun no estan disponibles en esta base de datos.");
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
    throw new Error("Los envios aun no estan disponibles en esta base de datos.");
  }

  if (existingShipment?.id) {
    const shipment = await getShipmentByIdInternal(existingShipment.id);
    if (!shipment) {
      throw new Error("No pudimos recuperar el envio ya creado.");
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
    throw new Error("Los envios aun no estan disponibles en esta base de datos.");
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
    throw new Error("Los envios aun no estan disponibles en esta base de datos.");
  }

  const user = await requireUser();
  const { data: conversation, error: conversationError } = await supabase
    .from("cargoo_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (isMissingCargooTable(conversationError)) {
    markShipmentFeatureUnavailable();
    throw new Error("Los envios aun no estan disponibles en esta base de datos.");
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
    throw new Error("Los envios aun no estan disponibles en esta base de datos.");
  }

  const mappedExistingShipmentError = mapSupabaseError(existingShipmentError);
  if (mappedExistingShipmentError) {
    throw mappedExistingShipmentError;
  }

  if (existingShipment?.id) {
    const shipment = await getShipmentByIdInternal(existingShipment.id);
    if (!shipment) {
      throw new Error("No pudimos recuperar el envio ya creado.");
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
      throw new Error("No pudimos recargar el envio cargado.");
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
    throw new Error("Los envios aun no estan disponibles en esta base de datos.");
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
    throw new Error("No encontramos ese envio.");
  }

  if (shipment.travelerId !== user.id) {
    throw new Error("Solo el transportista puede aceptar este envio.");
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
    throw new Error("No pudimos recargar el envio aceptado.");
  }

  return updatedShipment;
};

export const markShipmentDelivered = async (shipmentId: string) => {
  const user = await requireUser();
  const shipment = await getShipmentByIdInternal(shipmentId);

  if (!shipment) {
    throw new Error("No encontramos ese envio.");
  }

  if (shipment.travelerId !== user.id) {
    throw new Error("Solo el transportista puede marcar el paquete como entregado.");
  }

  if (shipment.status === "delivered") {
    return shipment;
  }

  if (shipment.status !== "accepted") {
    throw new Error("Primero debes aceptar el envio antes de marcarlo como entregado.");
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

  await syncTripCompletionState(user.id, shipment.tripId);

  const updatedShipment = await getShipmentByIdInternal(shipmentId);
  if (!updatedShipment) {
    throw new Error("No pudimos recargar el envio entregado.");
  }

  return updatedShipment;
};

export const submitShipmentReview = async ({ shipmentId, rating, comment }: SubmitShipmentReviewInput) => {
  const user = await requireUser();
  const shipment = await getShipmentByIdInternal(shipmentId);

  if (!shipment) {
    throw new Error("No encontramos ese envio.");
  }

  if (shipment.senderId !== user.id) {
    throw new Error("Solo el emisor puede valorar este envio.");
  }

  if (shipment.status !== "delivered") {
    throw new Error("Solo puedes valorar envios ya entregados.");
  }

  if (shipment.reviewRating) {
    throw new Error("Este envio ya tiene una valoracion registrada.");
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
  const otherUserIds = conversations.map((conversation) =>
    conversation.participant_one_id === user.id ? conversation.participant_two_id : conversation.participant_one_id,
  );
  const shipmentByConversationId = await getShipmentsByConversationIds(conversationIds);
  const avatarUrlByUserId = await getProfileAvatarUrlsByUserIds(otherUserIds);
  const { data: unreadMessages, error: unreadMessagesError } = await supabase
    .from("cargoo_messages")
    .select("conversation_id")
    .in("conversation_id", conversationIds)
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (isMissingCargooTable(unreadMessagesError)) {
    markChatFeatureUnavailable();
    return conversations.map((conversation) => mapConversationRow(conversation, user.id));
  }

  const mappedUnreadMessagesError = mapSupabaseError(unreadMessagesError);
  if (mappedUnreadMessagesError) {
    throw mappedUnreadMessagesError;
  }

  const unreadCountByConversationId = (unreadMessages ?? []).reduce<Record<string, number>>((counts, message) => {
    counts[message.conversation_id] = (counts[message.conversation_id] ?? 0) + 1;
    return counts;
  }, {});

  return conversations.map((conversation) =>
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

export const getOrCreateConversation = async (input: CreateConversationInput) => {
  if (isChatFeatureUnavailable()) {
    throw new Error("El chat aun no esta disponible en esta base de datos.");
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
    throw new Error("El chat aun no esta disponible en esta base de datos.");
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
    throw new Error("El chat aun no esta disponible en esta base de datos.");
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
    throw new Error("El chat aun no esta disponible en esta base de datos.");
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  markChatFeatureAvailable();

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
