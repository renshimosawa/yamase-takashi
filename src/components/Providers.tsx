"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";
import { getToken, onMessage } from "firebase/messaging";

import { getFirebaseMessagingClient } from "@/lib/firebase-client";

const FCM_TOKEN_STORAGE_KEY = "fcm_registration_token";

type ProvidersProps = {
  session: Session | null;
  children: ReactNode;
};

export default function Providers({ session, children }: ProvidersProps) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) {
            return;
          }
          installingWorker.addEventListener("statechange", () => {
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.info(
                "新しいバージョンのアプリが利用可能です。再読み込みして反映してください。"
              );
            }
          });
        });
      } catch (error) {
        console.error("Service Worker の登録に失敗しました", error);
      }
    };

    void register();

    return () => {
      // 登録解除は行わない
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    if (
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    ) {
      return;
    }

    let cancelled = false;

    const registerFcmToken = async () => {
      try {
        if (Notification.permission !== "granted") {
          return;
        }

        await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        const registration = await navigator.serviceWorker.ready;
        if (cancelled) {
          return;
        }

        const messaging = await getFirebaseMessagingClient();
        if (!messaging) {
          return;
        }

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (!token || cancelled) {
          return;
        }

        const response = await fetch("/api/notifications/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            platform: navigator.userAgent,
          }),
        });

        if (!response.ok) {
          console.error("Failed to save FCM token", await response.text());
          return;
        }

        localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
      } catch (error) {
        console.error("Failed to register FCM token", error);
      }
    };

    void registerFcmToken();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (
      !session?.user?.id ||
      typeof window === "undefined" ||
      !("Notification" in window)
    ) {
      return;
    }

    let cancelled = false;

    const cleanupTokenIfPermissionDenied = async () => {
      if (Notification.permission !== "denied") {
        return;
      }

      const token = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
      if (!token) {
        return;
      }

      try {
        const response = await fetch("/api/notifications/token", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          console.error("Failed to delete FCM token on denied permission");
          return;
        }

        if (!cancelled) {
          localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Failed to cleanup denied-permission FCM token", error);
      }
    };

    const handleFocus = () => {
      void cleanupTokenIfPermissionDenied();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void cleanupTokenIfPermissionDenied();
      }
    };

    void cleanupTokenIfPermissionDenied();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (
      !session?.user?.id ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    const subscribeForegroundMessage = async () => {
      const messaging = await getFirebaseMessagingClient();
      if (!messaging || cancelled) {
        return;
      }

      unsubscribe = onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? "新しい投稿があります";
        const body =
          payload.notification?.body ??
          "アプリを開いて最新の投稿を確認してください。";

        try {
          const notification = new Notification(title, {
            body,
            icon: "/favicon.png",
            badge: "/favicon.png",
          });
          notification.onclick = () => {
            window.location.href = "/";
          };
        } catch (error) {
          console.error("Failed to show foreground notification", error);
        }
      });
    };

    void subscribeForegroundMessage();

    return () => {
      cancelled = true;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [session?.user?.id]);

  if (typeof window === "undefined") {
    return <>{children}</>;
  }

  return <SessionProvider session={session}>{children}</SessionProvider>;
}
