"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "next-auth";
import { getSession, signIn, signOut } from "next-auth/react";
import { getToken } from "firebase/messaging";

import Header from "@/components/Header";
import { getFirebaseMessagingClient } from "@/lib/firebase-client";
import {
  NEUTRAL_SMELL_EMOJI,
  SMELL_TYPE_LABELS,
  getSmellIconPath,
  type SmellType,
} from "@/constants/smell";

const FCM_TOKEN_STORAGE_KEY = "fcm_registration_token";

type MapPost = {
  id: string;
  description: string;
  intensity: number | null;
  smell_type: SmellType | null;
  emoji: string | null;
  latitude: number | null;
  longitude: number | null;
  inserted_at: string | null;
};

type FetchState = "idle" | "loading" | "success" | "error";
type PwaGuidePlatform = "ios" | "android" | null;

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }
  const mediaStandalone = window.matchMedia(
    "(display-mode: standalone)"
  ).matches;
  const navigatorStandalone =
    typeof (window.navigator as Navigator & { standalone?: boolean })
      .standalone === "boolean" &&
    Boolean(
      (window.navigator as Navigator & { standalone?: boolean }).standalone
    );

  return mediaStandalone || navigatorStandalone;
}

function detectPwaGuidePlatform(): PwaGuidePlatform {
  if (typeof window === "undefined") {
    return null;
  }

  const isDesktopViewport = window.matchMedia("(min-width: 1024px)").matches;
  if (isDesktopViewport || isStandaloneMode()) {
    return null;
  }

  const ua = navigator.userAgent;
  const platform = navigator.platform;
  const maxTouchPoints = navigator.maxTouchPoints ?? 0;

  const isIosDevice =
    /iPhone|iPad|iPod/i.test(ua) ||
    (platform === "MacIntel" && maxTouchPoints > 1);
  const isSafari =
    /Safari/i.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser|DuckDuckGo/i.test(ua);
  if (isIosDevice && isSafari) {
    if ("Notification" in window && Notification.permission === "granted") {
      return null;
    }
    return "ios";
  }

  const isAndroid = /Android/i.test(ua);
  const isChrome = /Chrome/i.test(ua) && !/EdgA|OPR|SamsungBrowser/i.test(ua);
  if (isAndroid && isChrome) {
    return "android";
  }

  return null;
}

export default function MyPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");
  const [posts, setPosts] = useState<MapPost[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pwaGuidePlatform, setPwaGuidePlatform] =
    useState<PwaGuidePlatform>(null);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const [isNotificationRegistered, setIsNotificationRegistered] =
    useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(
    null
  );
  const [isUpdatingNotification, setIsUpdatingNotification] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const sessionData = await getSession();
        if (!isMounted) return;

        if (sessionData) {
          setSession(sessionData);
          setAuthStatus("authenticated");
        } else {
          setSession(null);
          setAuthStatus("unauthenticated");
        }
      } catch (error) {
        console.error("[mypage] Failed to load session", error);
        if (!isMounted) return;
        setSession(null);
        setAuthStatus("unauthenticated");
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadPosts = useCallback(async () => {
    setFetchState("loading");
    setFetchError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/my-posts", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "投稿の取得に失敗しました。");
      }

      const data = (await response.json()) as { posts: MapPost[] };
      setPosts(data.posts ?? []);
      setFetchState("success");
    } catch (error) {
      console.error("Failed to fetch my posts", error);
      setFetchState("error");
      setFetchError(
        error instanceof Error ? error.message : "投稿の取得に失敗しました。"
      );
    }
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      return;
    }

    void loadPosts();
  }, [authStatus, loadPosts]);

  useEffect(() => {
    setPwaGuidePlatform(detectPwaGuidePlatform());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      setIsNotificationRegistered(false);
      return;
    }
    setNotificationPermission(Notification.permission);
    setIsNotificationRegistered(
      Boolean(localStorage.getItem(FCM_TOKEN_STORAGE_KEY))
    );
  }, [authStatus, session?.user?.id]);

  const enableNotification = useCallback(async () => {
    if (!session?.user?.id) {
      setNotificationMessage("通知設定にはログインが必要です。");
      return;
    }

    if (
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    ) {
      setNotificationMessage("この環境では通知設定を利用できません。");
      return;
    }

    setIsUpdatingNotification(true);
    setNotificationMessage(null);
    try {
      const permission =
        Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;

      setNotificationPermission(permission);
      if (permission !== "granted") {
        setNotificationMessage(
          "通知が許可されていません。ブラウザ設定をご確認ください。"
        );
        return;
      }

      const messaging = await getFirebaseMessagingClient();
      if (!messaging) {
        setNotificationMessage("通知機能の初期化に失敗しました。");
        return;
      }

      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const registration = await navigator.serviceWorker.ready;
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        setNotificationMessage("通知トークンの取得に失敗しました。");
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
        setNotificationMessage("通知設定の保存に失敗しました。");
        return;
      }

      localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
      setIsNotificationRegistered(true);
      setNotificationMessage("通知を有効化しました。");
    } catch (error) {
      console.error("Failed to enable notification in mypage", error);
      setNotificationMessage("通知設定の更新中にエラーが発生しました。");
    } finally {
      setIsUpdatingNotification(false);
    }
  }, [session?.user?.id]);

  const disableNotification = useCallback(async () => {
    if (!session?.user?.id) {
      setNotificationMessage("通知設定にはログインが必要です。");
      return;
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(FCM_TOKEN_STORAGE_KEY)
        : null;

    if (!token) {
      setIsNotificationRegistered(false);
      setNotificationMessage("この端末の通知配信は停止済みです。");
      return;
    }

    setIsUpdatingNotification(true);
    setNotificationMessage(null);
    try {
      const response = await fetch("/api/notifications/token", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        setNotificationMessage("通知停止の反映に失敗しました。");
        return;
      }

      localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
      setIsNotificationRegistered(false);
      setNotificationMessage(
        "この端末への通知配信を停止しました。権限自体はブラウザ設定でOFFにできます。"
      );
    } catch (error) {
      console.error("Failed to disable notification in mypage", error);
      setNotificationMessage("通知停止中にエラーが発生しました。");
    } finally {
      setIsUpdatingNotification(false);
    }
  }, [session?.user?.id]);

  const handleDelete = useCallback(
    async (postId: string) => {
      if (!postId || deletingId) {
        return;
      }

      const target = posts.find((post) => post.id === postId);
      const confirmed = window.confirm(
        target
          ? `「${target.description}」を削除しますか？`
          : "この投稿を削除しますか？"
      );
      if (!confirmed) return;

      setDeletingId(postId);
      setMessage(null);

      try {
        const response = await fetch(`/api/posts/${postId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? "投稿の削除に失敗しました。");
        }

        setPosts((prev) => prev.filter((post) => post.id !== postId));
        setMessage("投稿を削除しました。");
      } catch (error) {
        console.error("Failed to delete post", error);
        setMessage(
          error instanceof Error ? error.message : "投稿の削除に失敗しました。"
        );
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, posts]
  );

  const isAuthenticated = authStatus === "authenticated" && session?.user;
  const isLoading = fetchState === "loading";
  const hasPosts = posts.length > 0;

  const headerMessage = useMemo(() => {
    if (!isAuthenticated) {
      return "マイページを利用するにはログインしてください。";
    }

    if (isLoading) {
      return "投稿を読み込んでいます…";
    }

    if (!hasPosts) {
      return "本日の投稿はまだありません。";
    }

    return `本日の投稿 (${posts.length}件)`;
  }, [isAuthenticated, isLoading, hasPosts, posts.length]);

  return (
    <div className="relative min-h-[100svh] w-screen bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#1f2937] text-white">
      <Header session={session} status={authStatus} />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pb-16 pt-28 sm:px-8">
        <div className="flex items-center">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-cyan-200/70 bg-cyan-400/20 px-4 py-2 text-sm font-semibold text-cyan-50 shadow-lg backdrop-blur transition hover:bg-cyan-300/30"
          >
            ← 地図へ戻る
          </Link>
        </div>
        {pwaGuidePlatform && (
          <section className="rounded-2xl border border-amber-200/40 bg-amber-500/10 p-4 shadow-lg">
            <h3 className="text-sm font-semibold text-amber-100">
              {pwaGuidePlatform === "android"
                ? "Androidで快適に使うには、ホーム画面への追加がおすすめです。"
                : "iPhoneで通知を受け取るには、ホーム画面への追加が必要です。"}
            </h3>
            <ol className="mt-2 space-y-1 text-xs text-amber-50/90">
              {pwaGuidePlatform === "android" ? (
                <>
                  <li>1. Chromeでこのサイトを開く</li>
                  <li>2. 右上メニュー（︙）をタップ</li>
                  <li>
                    3. 「ホーム画面に追加」または「アプリをインストール」を選択
                  </li>
                  <li>4. ホーム画面のアイコンから起動</li>
                </>
              ) : (
                <>
                  <li>1. Safariでこのサイトを開き、下部の共有ボタンをタップ</li>
                  <li>2. 「ホーム画面に追加」を選択</li>
                  <li>3. ホーム画面のアイコンからアプリを起動</li>
                  <li>4. 右上メニューの「通知を有効化」をタップ</li>
                </>
              )}
            </ol>
          </section>
        )}

        <h1 className="text-xl font-semibold tracking-wide">マイページ</h1>
        <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-base text-white">{headerMessage}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => void loadPosts()}
                  className="rounded-full border border-white/30 px-4 py-2 text-sm text-white transition hover:border-white/50 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isLoading}
                >
                  {isLoading ? "更新中..." : "最新の投稿を取得"}
                </button>
              )}
            </div>
          </div>
          {message && (
            <p className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white/80">
              {message}
            </p>
          )}
          {fetchError && (
            <p className="rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-200">
              {fetchError}
            </p>
          )}
          {!isAuthenticated ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-xl backdrop-blur">
              <p className="mb-4 text-sm text-white/70">
                ログインすると今日の投稿を確認・削除できます。
              </p>
              <button
                type="button"
                onClick={() => signIn("google")}
                className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Googleでサインイン
              </button>
            </div>
          ) : isLoading ? (
            <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
              <p className="text-sm text-white/70">読み込み中です...</p>
            </div>
          ) : !hasPosts ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-xl backdrop-blur">
              <p className="text-sm text-white/70">
                本日の投稿はまだありません。地図から投稿してみましょう。
              </p>
            </div>
          ) : (
            <section className="grid gap-4">
              {posts.map((post) => {
                const isNeutral = post.intensity === 0;
                const icon = isNeutral
                  ? post.emoji ?? NEUTRAL_SMELL_EMOJI
                  : null;
                const smellLabel =
                  post.smell_type && SMELL_TYPE_LABELS[post.smell_type];
                const formattedDate = post.inserted_at
                  ? new Date(post.inserted_at).toLocaleString("ja-JP")
                  : null;

                return (
                  <article
                    key={post.id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur transition hover:border-white/20"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                          {isNeutral ? (
                            icon
                          ) : (
                            <img
                              src={getSmellIconPath(post.smell_type ?? "hoya")}
                              alt={smellLabel ?? "においタイプ"}
                              className="h-9 w-9 rounded-full border border-white/20 bg-black/20 object-contain p-1"
                            />
                          )}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white/80">
                            {isNeutral
                              ? "においレベル 0"
                              : smellLabel ?? "においタイプ未設定"}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDelete(post.id)}
                        disabled={deletingId === post.id}
                        className="rounded-full border border-red-400/40 px-4 py-2 text-xs font-semibold text-red-200 transition hover:border-red-300/70 hover:bg-red-300/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === post.id ? "削除中..." : "削除する"}
                      </button>
                    </div>
                    <div className="space-y-3 text-sm text-white/80">
                      <p className="whitespace-pre-wrap rounded-2xl bg-black/30 p-4 text-white">
                        {post.description}
                      </p>
                      <div className="grid gap-2 text-xs text-white/60 sm:grid-cols-2">
                        {formattedDate && (
                          <span>投稿日時: {formattedDate}</span>
                        )}
                        {typeof post.latitude === "number" &&
                          typeof post.longitude === "number" && (
                            <span>
                              緯度: {post.latitude.toFixed(4)}｜経度:{" "}
                              {post.longitude.toFixed(4)}
                            </span>
                          )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>

        <h2 className="text-lg font-bold text-white">設定</h2>
        <section className="rounded-2xl border border-white/15 bg-white/5 p-4 shadow-lg">
          <p className="font-bold text-white">投稿通知</p>
          <p className="mt-1 text-xs text-white/70">
            現在の権限:{" "}
            {notificationPermission === "unsupported"
              ? "この端末では未対応"
              : notificationPermission === "granted"
              ? "許可"
              : notificationPermission === "denied"
              ? "拒否"
              : "未設定"}
            {" / "}
            配信状態: {isNotificationRegistered ? "ON" : "OFF"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void enableNotification()}
              disabled={isUpdatingNotification || !isAuthenticated}
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdatingNotification ? "更新中..." : "通知をONにする"}
            </button>
            <button
              type="button"
              onClick={() => void disableNotification()}
              disabled={isUpdatingNotification || !isAuthenticated}
              className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              この端末の通知をOFFにする
            </button>
          </div>
          {notificationMessage && (
            <p className="mt-2 text-xs text-white/70">{notificationMessage}</p>
          )}
        </section>

        {isAuthenticated && (
          <section className=" flex justify-center">
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/" })}
              className="mt-3 inline-flex items-center rounded-full border border-red-300/60 bg-red-400/15 px-4 py-2 text-xs font-semibold text-red-100 shadow backdrop-blur transition hover:bg-red-300/25"
            >
              サインアウト
            </button>
          </section>
        )}

        <section className="flex justify-center">
          <Link
            href="/feedback"
            className="inline-flex items-center rounded-full border border-cyan-200/70 bg-cyan-400/20 px-4 py-2 text-xs font-semibold text-cyan-50 shadow backdrop-blur transition hover:bg-cyan-300/30"
          >
            フィードバック
          </Link>
        </section>
      </main>
    </div>
  );
}
