"use client";

import * as React from "react";
import { savePushSubscriptionAction, deletePushSubscriptionAction } from "@/lib/actions/push";

/** Web Push wants the VAPID public key as a raw byte array, not the
 * URL-safe base64 string it's normally shared as. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [supported, setSupported] = React.useState(false);
  const [permission, setPermission] = React.useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function init() {
      const isSupported =
        typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!isSupported) {
        if (!cancelled) {
          setSupported(false);
          setLoading(false);
        }
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      if (!cancelled) {
        setSupported(true);
        setPermission(Notification.permission);
        setSubscribed(Boolean(existing));
        setLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = React.useCallback(async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) throw new Error("Thiếu cấu hình khoá công khai VAPID");

    const permissionResult = await Notification.requestPermission();
    setPermission(permissionResult);
    if (permissionResult !== "granted") {
      throw new Error("Bạn cần cho phép thông báo trong trình duyệt để bật tính năng này");
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      }));

    const json = subscription.toJSON();
    const result = await savePushSubscriptionAction({
      endpoint: subscription.endpoint,
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
      userAgent: navigator.userAgent,
    });
    if (result.error) throw new Error(result.error);

    setSubscribed(true);
  }, []);

  const unsubscribe = React.useCallback(async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await deletePushSubscriptionAction(subscription.endpoint);
      await subscription.unsubscribe();
    }
    setSubscribed(false);
  }, []);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}
