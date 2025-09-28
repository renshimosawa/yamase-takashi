"use client";

import type { Session } from "next-auth";
import { useEffect, useRef, useState } from "react";
import { signIn, signOut } from "next-auth/react";

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

  return (
    <header className="pointer-events-auto absolute left-6 right-6 top-6 z-[1000] flex items-center justify-between">
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
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow-lg transition hover:bg-white/90"
              aria-haspopup="true"
              aria-expanded={isMenuOpen}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-sm font-semibold uppercase">
                {session.user?.name?.charAt(0) ??
                  session.user?.email?.charAt(0) ??
                  "?"}
              </span>
              <span className="max-w-[12rem] truncate">
                {session.user?.name ?? session.user?.email ?? "ユーザー"}
              </span>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-48 rounded-xl bg-black/80 p-3 text-white shadow-xl backdrop-blur">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void signOut({ callbackUrl: "/" });
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
