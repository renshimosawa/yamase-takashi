"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

type ProvidersProps = {
  session: Session | null;
  children: ReactNode;
};

export default function Providers({ session, children }: ProvidersProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

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

  return <SessionProvider session={session}>{children}</SessionProvider>;
}
