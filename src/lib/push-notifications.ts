import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

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

const ensureBrowserSupport = () => {
  if (typeof window === "undefined") {
    throw new Error("Las notificaciones push solo se pueden configurar en el navegador.");
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    throw new Error("Este navegador no soporta notificaciones push.");
  }
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

const upsertRemoteSubscription = async (userId: string, subscription: PushSubscription) => {
  const { p256dh, auth } = getSubscriptionKeys(subscription);
  const endpoint = subscription.endpoint;

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

export const getNotificationPermissionState = () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported" as const;
  }

  return Notification.permission;
};

export const registerPushServiceWorker = async () => {
  ensureBrowserSupport();
  const registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
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
  ensureBrowserSupport();

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
  ensureBrowserSupport();
  await registerPushServiceWorker();

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return;
  }

  await deleteRemoteSubscriptionByEndpoint(subscription.endpoint);

  await subscription.unsubscribe();
};
