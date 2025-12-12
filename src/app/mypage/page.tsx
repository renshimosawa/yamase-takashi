"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "next-auth";
import { getSession, signIn } from "next-auth/react";

import Header from "@/components/Header";
import {
  NEUTRAL_SMELL_EMOJI,
  SMELL_TYPE_LABELS,
  getSmellIconPath,
  type SmellType,
} from "@/constants/smell";

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
        <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-wide">
                マイページ
              </h2>
              <p className="text-sm text-white/70">{headerMessage}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:border-white/40 hover:bg-white/10"
              >
                地図に戻る
              </Link>
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
        </div>

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
              const icon = isNeutral ? post.emoji ?? NEUTRAL_SMELL_EMOJI : null;
              const smellLabel =
                post.smell_type && SMELL_TYPE_LABELS[post.smell_type];
              const formattedDate = post.inserted_at
                ? new Date(post.inserted_at).toLocaleString("ja-JP")
                : null;

              return (
                <article
                  key={post.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur transition hover:border-white/20"
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
                            ? "においレベル 0 (絵文字ピン)"
                            : smellLabel ?? "においタイプ未設定"}
                        </span>
                        <span className="text-xs text-white/60">
                          Lv.{post.intensity ?? "-"}
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
                      {formattedDate && <span>投稿日時: {formattedDate}</span>}
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
      </main>
    </div>
  );
}
