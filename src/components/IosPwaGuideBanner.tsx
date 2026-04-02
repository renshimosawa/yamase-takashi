"use client";

import { useEffect, useMemo, useState } from "react";

const DISMISS_KEY = "ios_pwa_install_guide_dismissed";
const DISMISS_DAYS = 7;
const DISMISS_DURATION_MS = DISMISS_DAYS * 24 * 60 * 60 * 1000;

function isIosSafariBrowser() {
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  const maxTouchPoints = navigator.maxTouchPoints ?? 0;

  const isIosDevice =
    /iPhone|iPad|iPod/i.test(ua) ||
    (platform === "MacIntel" && maxTouchPoints > 1);
  const isSafari =
    /Safari/i.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser|DuckDuckGo/i.test(ua);

  return isIosDevice && isSafari;
}

function isAndroidChromeBrowser() {
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  const isChrome = /Chrome/i.test(ua) && !/EdgA|OPR|SamsungBrowser/i.test(ua);
  return isAndroid && isChrome;
}

function isStandaloneMode() {
  const mediaStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const navigatorStandalone =
    typeof (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      "boolean" &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

  return mediaStandalone || navigatorStandalone;
}

export default function IosPwaGuideBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isDesktopViewport = window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktopViewport) {
      return;
    }

    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) ?? "0");
    if (Number.isFinite(dismissedUntil) && dismissedUntil > Date.now()) {
      return;
    }

    const ios = isIosSafariBrowser();
    const android = isAndroidChromeBrowser();
    if (!ios && !android) {
      return;
    }

    if (isStandaloneMode()) {
      return;
    }

    if (ios && "Notification" in window && Notification.permission === "granted") {
      return;
    }

    setPlatform(ios ? "ios" : "android");
    setIsVisible(true);
  }, []);

  const dismissForAWhile = () => {
    localStorage.setItem(
      DISMISS_KEY,
      String(Date.now() + DISMISS_DURATION_MS)
    );
    setIsModalOpen(false);
    setIsVisible(false);
  };

  const shouldRender = useMemo(() => isVisible, [isVisible]);
  if (!shouldRender) {
    return null;
  }

  const titleText =
    platform === "android"
      ? "Androidで快適に使うには、ホーム画面への追加がおすすめです。"
      : "iPhoneで通知を受け取るには、ホーム画面への追加が必要です。";
  const descriptionText =
    platform === "android"
      ? "Chromeのメニューからホーム画面に追加すると、アプリのように使えます。"
      : "Safariタブ表示のままでは通知を受信できません。";

  return (
    <>
      <div className="pointer-events-auto absolute left-4 right-4 top-24 z-[3200] rounded-2xl border border-amber-200/40 bg-black/80 p-3 text-white shadow-2xl backdrop-blur sm:left-6 sm:right-6">
        <p className="text-sm font-semibold text-amber-100">
          {titleText}
        </p>
        <p className="mt-1 text-xs text-white/80">{descriptionText}</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-black transition hover:bg-amber-200"
          >
            手順を見る
          </button>
          <button
            type="button"
            onClick={() => {
              dismissForAWhile();
            }}
            className="rounded-full border border-white/30 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/10"
          >
            閉じる
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="pointer-events-auto fixed inset-0 z-[3300] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-slate-900 p-5 text-white shadow-2xl">
            <h2 className="text-base font-bold">
              {platform === "android"
                ? "Androidでホーム画面に追加する手順"
                : "iPhone通知の設定手順"}
            </h2>
            <ol className="mt-3 space-y-2 text-sm text-white/90">
              {platform === "android" ? (
                <>
                  <li>1. Chromeでこのサイトを開く</li>
                  <li>2. 右上メニュー（︙）をタップ</li>
                  <li>3. 「ホーム画面に追加」または「アプリをインストール」を選ぶ</li>
                  <li>4. ホーム画面のアイコンから起動する</li>
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
            <p className="mt-3 text-xs text-white/70">
              {platform === "android"
                ? "すでに追加済みの場合は、ホーム画面のアイコンから開いて利用してください。"
                : "すでにホーム画面追加済みの場合は、アプリを開き直してから通知を有効化してください。"}
            </p>
            <button
              type="button"
              onClick={() => {
                dismissForAWhile();
              }}
              className="mt-4 w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
