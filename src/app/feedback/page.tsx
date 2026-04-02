"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

type HubspotFormsApi = {
  forms: {
    create: (options: {
      region: string;
      portalId: string;
      formId: string;
      target: string;
    }) => void;
  };
};

declare global {
  interface Window {
    hbspt?: HubspotFormsApi;
  }
}

const HUBSPOT_SCRIPT_ID = "hubspot-forms-script";
const HUBSPOT_TARGET = "#hubspot-feedback-form";

export default function FeedbackPage() {
  const [isScriptReady, setIsScriptReady] = useState(false);

  const portalId = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID ?? "";
  const formId = process.env.NEXT_PUBLIC_HUBSPOT_FORM_ID ?? "";
  const region = process.env.NEXT_PUBLIC_HUBSPOT_REGION ?? "na1";
  const canRenderForm = portalId !== "" && formId !== "";

  const setupHint = useMemo(
    () =>
      "フォームを表示するには NEXT_PUBLIC_HUBSPOT_PORTAL_ID と NEXT_PUBLIC_HUBSPOT_FORM_ID を設定してください。",
    []
  );

  useEffect(() => {
    if (!isScriptReady || !canRenderForm || !window.hbspt) {
      return;
    }

    const target = document.querySelector(HUBSPOT_TARGET);
    if (!target) {
      return;
    }

    target.innerHTML = "";
    window.hbspt.forms.create({
      region,
      portalId,
      formId,
      target: HUBSPOT_TARGET,
    });
  }, [canRenderForm, formId, isScriptReady, portalId, region]);

  return (
    <div className="min-h-[100svh] bg-slate-50 text-slate-900">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-16 pt-10 sm:px-8">
        <div className="flex items-center">
          <Link
            href="/mypage"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            ← マイページへ戻る
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-wide sm:text-2xl">
            不具合報告・機能改善フォーム
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            不具合の報告や改善アイデアを受け付けています。個人運営のため反映に時間をいただく場合がありますが、いただいた内容は順次確認します。
          </p>
          {canRenderForm ? (
            <>
              <Script
                id={HUBSPOT_SCRIPT_ID}
                src="https://js.hsforms.net/forms/embed/v2.js"
                strategy="afterInteractive"
                onLoad={() => setIsScriptReady(true)}
              />
              <div id="hubspot-feedback-form" className="mt-4" />
            </>
          ) : (
            <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {setupHint}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
