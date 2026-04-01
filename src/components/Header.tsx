"use client";

import Link from "next/link";
import type { Session } from "next-auth";
import { useEffect, useRef, useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { getToken } from "firebase/messaging";

import { getFirebaseMessagingClient } from "@/lib/firebase-client";

export type HeaderProps = {
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
};

export default function Header({ session, status }: HeaderProps) {
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && session?.user;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const deleteCurrentFcmToken = async () => {
    if (
      !("serviceWorker" in navigator) ||
      !process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    ) {
      return;
    }

    try {
      const messaging = await getFirebaseMessagingClient();
      if (!messaging) {
        return;
      }

      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const registration = await navigator.serviceWorker.ready;

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        return;
      }

      const response = await fetch("/api/notifications/token", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        console.error("Failed to delete FCM token", await response.text());
      }
    } catch (error) {
      console.error("Failed to delete current FCM token", error);
    }
  };

  return (
    <header className="pointer-events-auto absolute left-6 right-6 top-6 z-[3000] flex items-center justify-between">
      <h1 className="rounded-full bg-black/70 p-4 text-xl font-semibold text-white shadow-lg backdrop-blur">
        ヤマセ君の知らせ
      </h1>
      <div className="flex items-center gap-4">
        {isLoading ? (
          <span className="text-white/70">認証確認中...</span>
        ) : isAuthenticated ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full bg-white px-2 py-2 text-sm font-semibold text-black shadow-lg transition hover:bg-white/90"
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-sm font-semibold uppercase">
                {session.user?.name?.charAt(0) ??
                  session.user?.email?.charAt(0) ??
                  "?"}
              </span>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 z-[3100] mt-3 w-48 rounded-xl bg-black/80 p-3 text-white shadow-xl backdrop-blur">
                <Link
                  href="/mypage"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/10"
                >
                  マイページ
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    setIsMenuOpen(false);
                    await deleteCurrentFcmToken();
                    await signOut({ callbackUrl: "/" });
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/10"
                >
                  サインアウト
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => signIn()}
            className="rounded-full bg-blue-500 px-4 py-2 text-white"
          >
            サインイン
          </button>
        )}
      </div>
    </header>
  );
}
