import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export interface CargooUser {
  userId: string;
  name: string;
  email: string;
  isTraveler: boolean;
  isPublic: boolean;
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

export interface ConversationSummary {
  id: string;
  tripId: string | null;
  otherUserId: string;
  otherUserName: string;
  otherUserIsTraveler: boolean;
  routeOrigin: string;
  routeDestination: string;
  lastMessageText: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
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
    phone: typeof metadata.phone === "string" ? metadata.phone : "",
    location: typeof metadata.location === "string" && metadata.location.trim() ? metadata.location : DEFAULT_LOCATION,
    bio: typeof metadata.bio === "string" && metadata.bio.trim() ? metadata.bio : DEFAULT_BIO,
  };
};

const profileToMetadata = (profile: CargooUser) => ({
  name: profile.name,
  is_traveler: profile.isTraveler,
  is_public: profile.isPublic,
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
      status: nextCurrentStopIndex >= tripDetails.stops.length - 1 ? "completed" : tripRecord.status,
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
    phone: string | null;
    location: string | null;
    bio: string | null;
  },
  email: string,
): CargooUser => ({
  userId: row.user_id,
  name: row.name,
  email,
  isTraveler: row.is_traveler,
  isPublic: row.is_public,
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
type TripStopRow = Database["public"]["Tables"]["cargoo_trip_stops"]["Row"];

const mapTripStopRow = (row: TripStopRow): CargooTripStop => ({
  id: row.id,
  city: row.city,
  order: row.stop_order,
  reachedAt: row.reached_at,
});

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
    status: nextStop ? trip.status : "completed",
    stops: resolvedStops,
    currentStopIndex,
    lastCheckpointCity: currentStop?.city ?? trip.origin,
    lastCheckpointAt: currentStop?.reachedAt ?? null,
    nextStop,
    progressPercent,
    trackingAvailable,
  };
};

const mapConversationRow = (row: ConversationRow, currentUserId: string, unreadCount = 0): ConversationSummary => {
  const isParticipantOne = row.participant_one_id === currentUserId;

  return {
    id: row.id,
    tripId: row.trip_id,
    otherUserId: isParticipantOne ? row.participant_two_id : row.participant_one_id,
    otherUserName: isParticipantOne ? row.participant_two_name : row.participant_one_name,
    otherUserIsTraveler: isParticipantOne ? row.participant_two_is_traveler : row.participant_one_is_traveler,
    routeOrigin: row.route_origin ?? "",
    routeDestination: row.route_destination ?? "",
    lastMessageText: row.last_message_text ?? "Sin mensajes todavia.",
    lastMessageAt: row.last_message_at ?? row.created_at ?? new Date().toISOString(),
    unreadCount,
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

const buildProfilePayload = (user: User) => {
  const profile = buildProfileFromMetadata(user);

  return {
    user_id: user.id,
    name: profile.name,
    is_traveler: profile.isTraveler,
    is_public: profile.isPublic,
    phone: profile.phone,
    location: profile.location,
    bio: profile.bio,
  };
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
    return mapProfileRow(data, user.email ?? "");
  }

  const payload = buildProfilePayload(user);
  const { data: createdProfile, error: createError } = await supabase
    .from("cargoo_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (isMissingCargooTable(createError)) {
    const nextUser = await updateUserMetadata(profileToMetadata(buildProfileFromMetadata(user)));
    return buildProfileFromMetadata(nextUser);
  }

  const mappedCreateError = mapSupabaseError(createError);
  if (mappedCreateError) {
    throw mappedCreateError;
  }

  return mapProfileRow(createdProfile, user.email ?? "");
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
    phone: nextProfile.phone,
    location: nextProfile.location,
    bio: nextProfile.bio,
  };

  const { data, error } = await supabase.from("cargoo_profiles").upsert(payload, { onConflict: "user_id" }).select("*").single();

  if (isMissingCargooTable(error)) {
    return buildProfileFromMetadata(nextUser);
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  return mapProfileRow(data, nextProfile.email);
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

  if (isLastStop) {
    const { error: tripUpdateError } = await supabase
      .from("cargoo_trips")
      .update({ status: "completed" })
      .eq("id", tripId)
      .eq("user_id", user.id);

    const mappedTripUpdateError = mapSupabaseError(tripUpdateError);
    if (mappedTripUpdateError) {
      throw mappedTripUpdateError;
    }
  }

  const updatedTripDetails = await getTripById(tripId);
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
  const tripCountByUserId = publicTrips.reduce<Record<string, number>>((counts, trip) => {
    counts[trip.user_id] = (counts[trip.user_id] ?? 0) + 1;
    return counts;
  }, {});

  return publicTrips.map((trip) => {
    const profile = profileByUserId.get(trip.user_id);

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
      tripsCount: tripCountByUserId[trip.user_id] ?? 1,
    } satisfies PublicTripListing;
  });
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
  const tripsCount = upcomingTrips.length;

  return {
    userId: profile.user_id,
    name: profile.name,
    location: profile.location ?? DEFAULT_LOCATION,
    bio: profile.bio ?? DEFAULT_BIO,
    phone: profile.phone ?? "",
    isTraveler: profile.is_traveler,
    trips: upcomingTrips.map((trip) => ({
      id: trip.id,
      userId: trip.user_id,
      carrierName: profile.name,
      carrierLocation: profile.location ?? DEFAULT_LOCATION,
      origin: trip.origin,
      destination: trip.destination,
      date: trip.trip_date,
      capacityKg: trip.capacity_kg,
      availableKg: Math.max(trip.capacity_kg - trip.used_kg, 0),
      notes: trip.notes ?? "",
      tripsCount,
    })),
  } satisfies PublicCarrierProfile;
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
    mapConversationRow(conversation, user.id, unreadCountByConversationId[conversation.id] ?? 0),
  );
};

export const getConversationMessages = async (conversationId: string) => {
  if (isChatFeatureUnavailable()) {
    return null as { conversation: ConversationSummary; messages: ChatMessage[] } | null;
  }

  const user = await requireUser();
  const { data: conversation, error: conversationError } = await supabase
    .from("cargoo_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (isMissingCargooTable(conversationError)) {
    markChatFeatureUnavailable();
    return null as { conversation: ConversationSummary; messages: ChatMessage[] } | null;
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
    return null as { conversation: ConversationSummary; messages: ChatMessage[] } | null;
  }

  const mappedMessagesError = mapSupabaseError(messagesError);
  if (mappedMessagesError) {
    throw mappedMessagesError;
  }

  const unreadCount = (messages ?? []).filter((message) => message.sender_id !== user.id && !message.read_at).length;

  return {
    conversation: mapConversationRow(conversation, user.id, unreadCount),
    messages: (messages ?? []).map(mapMessageRow),
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
