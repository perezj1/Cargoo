import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

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
}

type MetadataRecord = Record<string, unknown>;

const DEFAULT_LOCATION = "Madrid, Espana";
const DEFAULT_BIO = "Conductor habitual con espacio disponible para mover paquetes entre ciudades.";

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

const getMetadataTrips = (user: User): CargooTrip[] => {
  const metadata = toMetadata(user);
  const rawTrips = metadata.cargoo_trips;

  if (!Array.isArray(rawTrips)) {
    return [];
  }

  return rawTrips
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
        status: item.status,
        createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
      } satisfies CargooTrip;
    })
    .filter((trip): trip is CargooTrip => trip !== null)
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
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
  status: row.status,
  createdAt: row.created_at ?? new Date().toISOString(),
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

export const createTrip = async (trip: CreateTripInput) => {
  const user = await requireUser();
  const nextTrip: CargooTrip = {
    id: `trip-${Date.now()}`,
    origin: trip.origin,
    destination: trip.destination,
    date: trip.date,
    capacityKg: trip.capacityKg,
    usedKg: 0,
    requests: 0,
    notes: trip.notes,
    status: new Date(trip.date).getTime() < Date.now() ? "completed" : "active",
    createdAt: new Date().toISOString(),
  };

  const payload = {
    user_id: user.id,
    origin: nextTrip.origin,
    destination: nextTrip.destination,
    trip_date: nextTrip.date,
    capacity_kg: nextTrip.capacityKg,
    used_kg: nextTrip.usedKg,
    requests: nextTrip.requests,
    notes: nextTrip.notes,
    status: nextTrip.status,
  };

  const { data, error } = await supabase.from("cargoo_trips").insert(payload).select("*").single();

  if (isMissingCargooTable(error)) {
    const nextTrips = [nextTrip, ...getMetadataTrips(user)];
    await updateUserMetadata({ cargoo_trips: nextTrips });
    return nextTrip;
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
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
    return getMetadataTrips(user).find((trip) => trip.id === tripId) ?? null;
  }

  const mappedError = mapSupabaseError(error);
  if (mappedError) {
    throw mappedError;
  }

  return data ? mapTripRow(data) : null;
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
