import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.6";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const APP_ORIGIN = (Deno.env.get("APP_ORIGIN") || "http://localhost:5173").replace(/\/+$/, "");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  throw new Error("Missing VAPID keys");
}

webpush.setVapidDetails("mailto:support@cargoo.app", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type Locale = "es" | "en" | "de";

type PushEventPayload =
  | { eventType: "trip_checkpoint_reached"; tripId: string; stopId: string; city?: string }
  | { eventType: "shipment_delivered"; shipmentId: string }
  | { eventType: "message_received"; messageId: string };

type PushSubscriptionRow = {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type PreferenceRow = {
  user_id: string;
  notifications_enabled: boolean;
};

type ProfileRow = {
  user_id?: string;
  id?: string;
  locale: string | null;
};

type PushMessage = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const strings = {
  es: {
    checkpointTitle: "Cargoo - Actualizacion de ruta",
    checkpointBody: (travelerName: string, city: string) => `${travelerName} ha llegado a ${city}.`,
    deliveredTitle: "Cargoo - Paquete entregado",
    deliveredBody: (travelerName: string, destination: string) =>
      destination
        ? `${travelerName} ha marcado tu paquete como entregado en ${destination}.`
        : `${travelerName} ha marcado tu paquete como entregado.`,
    messageTitle: (senderName: string) => `Cargoo - Nuevo mensaje de ${senderName}`,
    messageBody: (content: string) => content || "Has recibido un nuevo mensaje.",
  },
  en: {
    checkpointTitle: "Cargoo - Route update",
    checkpointBody: (travelerName: string, city: string) => `${travelerName} has reached ${city}.`,
    deliveredTitle: "Cargoo - Package delivered",
    deliveredBody: (travelerName: string, destination: string) =>
      destination
        ? `${travelerName} marked your package as delivered in ${destination}.`
        : `${travelerName} marked your package as delivered.`,
    messageTitle: (senderName: string) => `Cargoo - New message from ${senderName}`,
    messageBody: (content: string) => content || "You received a new message.",
  },
  de: {
    checkpointTitle: "Cargoo - Routen-Update",
    checkpointBody: (travelerName: string, city: string) => `${travelerName} ist in ${city} angekommen.`,
    deliveredTitle: "Cargoo - Paket zugestellt",
    deliveredBody: (travelerName: string, destination: string) =>
      destination
        ? `${travelerName} hat dein Paket in ${destination} als zugestellt markiert.`
        : `${travelerName} hat dein Paket als zugestellt markiert.`,
    messageTitle: (senderName: string) => `Cargoo - Neue Nachricht von ${senderName}`,
    messageBody: (content: string) => content || "Du hast eine neue Nachricht erhalten.",
  },
} satisfies Record<
  Locale,
  {
    checkpointTitle: string;
    checkpointBody: (travelerName: string, city: string) => string;
    deliveredTitle: string;
    deliveredBody: (travelerName: string, destination: string) => string;
    messageTitle: (senderName: string) => string;
    messageBody: (content: string) => string;
  }
>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function pickLocale(raw: string | null | undefined): Locale {
  const value = (raw || "").toLowerCase();
  if (value.startsWith("de")) return "de";
  if (value.startsWith("en")) return "en";
  return "es";
}

function isMissingProfileLocaleSource(error: { message?: string; code?: string } | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST205" ||
    /Could not find the table/i.test(error.message ?? "") ||
    /relation .* does not exist/i.test(error.message ?? "") ||
    /locale/i.test(error.message ?? "")
  );
}

function compactText(value: string, maxLength = 140) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function toAbsoluteUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${APP_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authHeader.slice(7).trim() || null;
}

async function getAuthenticatedUserId(req: Request) {
  const token = getBearerToken(req);
  if (!token) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error("auth.getUser error", error);
    return null;
  }

  return user.id;
}

async function getPushTargets(userIds: string[]) {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  if (!uniqueUserIds.length) {
    return [] as Array<PushSubscriptionRow & { locale: Locale }>;
  }

  const [{ data: subscriptions, error: subscriptionsError }, { data: preferences, error: preferencesError }] = await Promise.all([
    supabase.from("push_subscriptions").select("user_id, endpoint, p256dh, auth").in("user_id", uniqueUserIds),
    supabase.from("preferences").select("user_id, notifications_enabled").in("user_id", uniqueUserIds),
  ]);

  let profiles: ProfileRow[] | null = null;

  const { data: cargooProfiles, error: cargooProfilesError } = await supabase
    .from("cargoo_profiles")
    .select("user_id, locale")
    .in("user_id", uniqueUserIds);

  if (!cargooProfilesError) {
    profiles = cargooProfiles as ProfileRow[] | null;
  } else if (isMissingProfileLocaleSource(cargooProfilesError)) {
    const { data: legacyProfiles, error: legacyProfilesError } = await supabase
      .from("profiles")
      .select("id, locale")
      .in("id", uniqueUserIds);

    if (legacyProfilesError && !isMissingProfileLocaleSource(legacyProfilesError)) {
      throw legacyProfilesError;
    }

    profiles = (legacyProfiles as ProfileRow[] | null) ?? [];
  } else {
    throw cargooProfilesError;
  }

  if (subscriptionsError) {
    throw subscriptionsError;
  }

  if (preferencesError) {
    throw preferencesError;
  }

  const notificationsByUserId = new Map<string, boolean>();
  (preferences as PreferenceRow[] | null)?.forEach((row) => {
    notificationsByUserId.set(row.user_id, row.notifications_enabled);
  });

  const localeByUserId = new Map<string, Locale>();
  (profiles as ProfileRow[] | null)?.forEach((row) => {
    localeByUserId.set(row.user_id ?? row.id ?? "", pickLocale(row.locale));
  });

  return ((subscriptions as PushSubscriptionRow[] | null) || [])
    .filter((row) => notificationsByUserId.get(row.user_id) !== false)
    .map((row) => ({
      ...row,
      locale: localeByUserId.get(row.user_id) ?? "es",
    }));
}

async function sendPushToUsers(
  userIds: string[],
  buildPayload: (context: { userId: string; locale: Locale }) => PushMessage | null,
) {
  const targets = await getPushTargets(userIds);

  let sent = 0;
  let cleaned = 0;
  let failed = 0;

  const jobs = targets.map(async (target) => {
    const payload = buildPayload({ userId: target.user_id, locale: target.locale });
    if (!payload) {
      return;
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: target.endpoint,
          keys: {
            p256dh: target.p256dh,
            auth: target.auth,
          },
        },
        JSON.stringify({
          ...payload,
          url: toAbsoluteUrl(payload.url),
        }),
      );

      sent += 1;
    } catch (error) {
      const pushError = error as { statusCode?: number; body?: string };
      if (pushError.statusCode === 404 || pushError.statusCode === 410) {
        cleaned += 1;
        await supabase.from("push_subscriptions").delete().eq("endpoint", target.endpoint);
        return;
      }

      failed += 1;
      console.error("push error", pushError.statusCode, pushError.body);
    }
  });

  await Promise.allSettled(jobs);

  return {
    targets: targets.length,
    sent,
    cleaned,
    failed,
  };
}

async function notifyCheckpointReached(actorUserId: string, payload: Extract<PushEventPayload, { eventType: "trip_checkpoint_reached" }>) {
  const { data: stop, error: stopError } = await supabase
    .from("cargoo_trip_stops")
    .select("id, trip_id, city, reached_at")
    .eq("id", payload.stopId)
    .maybeSingle();

  if (stopError) {
    throw stopError;
  }

  if (!stop || stop.trip_id !== payload.tripId || !stop.reached_at) {
    return { ok: true, skipped: true, reason: "stop_not_found_or_not_reached" };
  }

  const { data: trip, error: tripError } = await supabase
    .from("cargoo_trips")
    .select("id")
    .eq("id", stop.trip_id)
    .eq("user_id", actorUserId)
    .maybeSingle();

  if (tripError) {
    throw tripError;
  }

  if (!trip) {
    throw new HttpError(403, "forbidden");
  }

  const { data: shipments, error: shipmentsError } = await supabase
    .from("cargoo_shipments")
    .select("sender_id, conversation_id, traveler_name")
    .eq("trip_id", stop.trip_id)
    .eq("status", "accepted");

  if (shipmentsError) {
    throw shipmentsError;
  }

  const recipients = new Map<string, { conversationId: string | null; travelerName: string }>();
  for (const shipment of shipments || []) {
    if (!recipients.has(shipment.sender_id)) {
      recipients.set(shipment.sender_id, {
        conversationId: shipment.conversation_id,
        travelerName: shipment.traveler_name || "El transportista",
      });
    }
  }

  const result = await sendPushToUsers(Array.from(recipients.keys()), ({ userId, locale }) => {
    const recipient = recipients.get(userId);
    if (!recipient) {
      return null;
    }

    return {
      title: strings[locale].checkpointTitle,
      body: strings[locale].checkpointBody(recipient.travelerName, stop.city),
      url: recipient.conversationId ? `/app/messages/${recipient.conversationId}` : "/app/shipments",
      tag: `trip-stop-${stop.trip_id}-${stop.id}`,
    };
  });

  return {
    ok: true,
    eventType: payload.eventType,
    tripId: stop.trip_id,
    city: stop.city,
    ...result,
  };
}

async function notifyShipmentDelivered(actorUserId: string, payload: Extract<PushEventPayload, { eventType: "shipment_delivered" }>) {
  const { data: shipment, error: shipmentError } = await supabase
    .from("cargoo_shipments")
    .select("id, sender_id, traveler_id, traveler_name, route_destination, status, conversation_id")
    .eq("id", payload.shipmentId)
    .maybeSingle();

  if (shipmentError) {
    throw shipmentError;
  }

  if (!shipment || shipment.traveler_id !== actorUserId) {
    throw new HttpError(403, "forbidden");
  }

  if (shipment.status !== "delivered") {
    return { ok: true, skipped: true, reason: "shipment_not_delivered_yet" };
  }

  const result = await sendPushToUsers([shipment.sender_id], ({ locale }) => ({
    title: strings[locale].deliveredTitle,
    body: strings[locale].deliveredBody(shipment.traveler_name || "El transportista", shipment.route_destination || ""),
    url: shipment.conversation_id ? `/app/messages/${shipment.conversation_id}` : "/app/shipments",
    tag: `shipment-delivered-${shipment.id}`,
  }));

  return {
    ok: true,
    eventType: payload.eventType,
    shipmentId: shipment.id,
    ...result,
  };
}

async function notifyMessageReceived(actorUserId: string, payload: Extract<PushEventPayload, { eventType: "message_received" }>) {
  const { data: message, error: messageError } = await supabase
    .from("cargoo_messages")
    .select("id, conversation_id, sender_id, content")
    .eq("id", payload.messageId)
    .maybeSingle();

  if (messageError) {
    throw messageError;
  }

  if (!message || message.sender_id !== actorUserId) {
    throw new HttpError(403, "forbidden");
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("cargoo_conversations")
    .select("id, participant_one_id, participant_one_name, participant_two_id, participant_two_name")
    .eq("id", message.conversation_id)
    .maybeSingle();

  if (conversationError) {
    throw conversationError;
  }

  if (!conversation) {
    return { ok: true, skipped: true, reason: "conversation_not_found" };
  }

  const senderIsParticipantOne = conversation.participant_one_id === message.sender_id;
  const recipientUserId = senderIsParticipantOne ? conversation.participant_two_id : conversation.participant_one_id;
  const senderName = senderIsParticipantOne ? conversation.participant_one_name : conversation.participant_two_name;

  const result = await sendPushToUsers([recipientUserId], ({ locale }) => ({
    title: strings[locale].messageTitle(senderName || "Cargoo"),
    body: strings[locale].messageBody(compactText(message.content || "")),
    url: `/app/messages/${conversation.id}`,
    tag: `message-${conversation.id}`,
  }));

  return {
    ok: true,
    eventType: payload.eventType,
    messageId: message.id,
    conversationId: conversation.id,
    ...result,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  const actorUserId = await getAuthenticatedUserId(req);
  if (!actorUserId) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  let payload: PushEventPayload;
  try {
    payload = (await req.json()) as PushEventPayload;
  } catch (_error) {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  try {
    switch (payload.eventType) {
      case "trip_checkpoint_reached":
        return json(await notifyCheckpointReached(actorUserId, payload));
      case "shipment_delivered":
        return json(await notifyShipmentDelivered(actorUserId, payload));
      case "message_received":
        return json(await notifyMessageReceived(actorUserId, payload));
      default:
        return json({ ok: false, error: "unsupported_event_type" }, 400);
    }
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "unknown_error";
    console.error("send-reminders error", message);
    return json({ ok: false, error: message }, status);
  }
});
