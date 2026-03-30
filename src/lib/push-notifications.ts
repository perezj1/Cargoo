import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const SERVICE_WORKER_URL = "/sw.js?v=10";
let pushSubscriptionWriteQueue = Promise.resolve();

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
};

const ensureServiceWorkerSupport = () => {
  if (typeof window === "undefined") {
    throw new Error("La PWA solo se puede configurar en el navegador.");
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error("Este navegador no soporta service workers.");
  }
};

const ensurePushSupport = () => {
  ensureServiceWorkerSupport();

  if (!("PushManager" in window) || !("Notification" in window)) {
    throw new Error("Este navegador no soporta notificaciones push.");
  }
};

const cleanupLegacyServiceWorkers = async () => {
  ensureServiceWorkerSupport();

  const currentScriptUrl = new URL(SERVICE_WORKER_URL, window.location.origin).toString();
  const registrations = await navigator.serviceWorker.getRegistrations();

  await Promise.all(
    registrations.map(async (registration) => {
      const scriptUrls = [registration.active?.scriptURL, registration.waiting?.scriptURL, registration.installing?.scriptURL].filter(
        (value): value is string => Boolean(value),
      );

      if (!registration.scope.startsWith(window.location.origin) || scriptUrls.length === 0) {
        return;
      }

      const usesCurrentScript = scriptUrls.some((scriptUrl) => scriptUrl === currentScriptUrl);
      if (!usesCurrentScript) {
        await registration.unregister();
      }
    }),
  );
};

const getSubscriptionKeys = (subscription: PushSubscription) => {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!p256dh || !auth) {
    throw new Error("No pudimos leer las claves de la suscripcion push.");
  }

  return { p256dh, auth };
};

const runPushSubscriptionWrite = async <T>(operation: () => Promise<T>) => {
  const nextOperation = pushSubscriptionWriteQueue.then(operation, operation);
  pushSubscriptionWriteQueue = nextOperation.then(
    () => undefined,
    () => undefined,
  );

  return nextOperation;
};

const isPushSubscriptionConflictError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    details?: string;
    status?: number;
  };

  return (
    candidate.status === 409 ||
    candidate.code === "23505" ||
    candidate.message?.toLowerCase().includes("duplicate") === true ||
    candidate.details?.toLowerCase().includes("already exists") === true
  );
};

const saveRemoteSubscription = async (userId: string, endpoint: string, p256dh: string, auth: string) => {
  const { data: existingRows, error: existingError } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("endpoint", endpoint);

  if (existingError) {
    throw existingError;
  }

  const firstRow = existingRows?.[0];
  const duplicateIds = existingRows?.slice(1).map((row) => row.id) ?? [];

  if (firstRow) {
    const { error: updateError } = await supabase
      .from("push_subscriptions")
      .update({
        user_id: userId,
        endpoint,
        p256dh,
        auth,
      })
      .eq("id", firstRow.id);

    if (updateError) {
      throw updateError;
    }

    if (duplicateIds.length > 0) {
      const { error: cleanupError } = await supabase.from("push_subscriptions").delete().in("id", duplicateIds);
      if (cleanupError) {
        throw cleanupError;
      }
    }

    return;
  }

  const { error: insertError } = await supabase.from("push_subscriptions").insert({
    user_id: userId,
    endpoint,
    p256dh,
    auth,
  });

  if (insertError) {
    throw insertError;
  }
};

const resolvePushSubscriptionConflict = async (userId: string, endpoint: string, p256dh: string, auth: string) => {
  const { data: conflictingRows, error: conflictLookupError } = await supabase
    .from("push_subscriptions")
    .select("id")
    .eq("endpoint", endpoint);

  if (conflictLookupError) {
    throw conflictLookupError;
  }

  const firstRow = conflictingRows?.[0];
  const duplicateIds = conflictingRows?.slice(1).map((row) => row.id) ?? [];

  if (!firstRow) {
    return false;
  }

  const { error: updateError } = await supabase
    .from("push_subscriptions")
    .update({
      user_id: userId,
      endpoint,
      p256dh,
      auth,
    })
    .eq("id", firstRow.id);

  if (updateError) {
    throw updateError;
  }

  if (duplicateIds.length > 0) {
    const { error: cleanupError } = await supabase.from("push_subscriptions").delete().in("id", duplicateIds);
    if (cleanupError) {
      throw cleanupError;
    }
  }

  return true;
};

const upsertRemoteSubscription = async (userId: string, subscription: PushSubscription) => {
  const { p256dh, auth } = getSubscriptionKeys(subscription);
  const endpoint = subscription.endpoint;

  await runPushSubscriptionWrite(async () => {
    try {
      await saveRemoteSubscription(userId, endpoint, p256dh, auth);
    } catch (error) {
      if (!isPushSubscriptionConflictError(error)) {
        throw error;
      }

      const recovered = await resolvePushSubscriptionConflict(userId, endpoint, p256dh, auth);
      if (!recovered) {
        throw error;
      }
    }
  });
};

export const getNotificationPermissionState = () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported" as const;
  }

  return Notification.permission;
};

export const registerPushServiceWorker = async () => {
  ensureServiceWorkerSupport();
  await cleanupLegacyServiceWorkers();
  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: "/", updateViaCache: "none" });
  void registration.update().catch(() => {
    // If the browser cannot check for updates right now, the existing worker still works.
  });
  return registration;
};

const deleteRemoteSubscriptionByEndpoint = async (endpoint: string) => {
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) {
    throw error;
  }
};

export const syncPushSubscription = async (
  userId: string,
  options?: { requestPermission?: boolean; forceRefresh?: boolean },
) => {
  ensurePushSupport();

  if (!VAPID_PUBLIC_KEY) {
    throw new Error("Falta configurar VITE_VAPID_PUBLIC_KEY en el frontend.");
  }

  await registerPushServiceWorker();

  let permission = Notification.permission;
  if (permission === "default" && options?.requestPermission !== false) {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    throw new Error("El navegador no concedio permiso para las notificaciones.");
  }

  const registration = await navigator.serviceWorker.ready;
  let existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription && options?.forceRefresh) {
    try {
      await deleteRemoteSubscriptionByEndpoint(existingSubscription.endpoint);
    } catch {
      // If the remote row does not exist we can still continue with a local refresh.
    }

    await existingSubscription.unsubscribe();
    existingSubscription = null;
  }

  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  await upsertRemoteSubscription(userId, subscription);
  return subscription;
};

export const removePushSubscription = async () => {
  ensurePushSupport();
  await registerPushServiceWorker();

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return;
  }

  await deleteRemoteSubscriptionByEndpoint(subscription.endpoint);

  await subscription.unsubscribe();
};
