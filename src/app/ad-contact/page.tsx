"use client";

import { useCallback, useEffect, useRef } from "react";
import Script from "next/script";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/heic",
  "image/heif",
];
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp|svg|heic|heif)$/i;
const ALERT_MESSAGE =
  "画像ファイル（JPG・PNG・WebP・SVG・HEIC）のみアップロード可能です。";

function isValidImageFile(file: File): boolean {
  if (ALLOWED_TYPES.includes(file.type)) return true;
  return ALLOWED_EXTENSIONS.test(file.name);
}

export default function AdContactPage() {
  // 選択中ファイルが有効かどうかを再描画をまたいで保持
  const fileValidRef = useRef(false);
  const createdRef = useRef(false);

  const setupValidation = useCallback(() => {
    const iframe = document.querySelector<HTMLIFrameElement>("#hs-form-iframe-0");
    const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
    if (!doc || !doc.body) return false;

    const input = doc.querySelector<HTMLInputElement>('input[type="file"]');
    const submit = doc.querySelector<HTMLInputElement>(
      'input[type="submit"], button[type="submit"]',
    );
    if (!input || !submit) return false;

    const setSubmitEnabled = (enabled: boolean) => {
      if (enabled) {
        submit.removeAttribute("disabled");
        submit.style.opacity = "";
        submit.style.cursor = "";
      } else {
        submit.setAttribute("disabled", "disabled");
        submit.style.opacity = "0.4";
        submit.style.cursor = "not-allowed";
      }
    };

    if (!input.dataset.validated) {
      input.dataset.validated = "true";
      input.accept = "image/*,.heic,.heif";

      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (file && !isValidImageFile(file)) {
          window.alert(ALERT_MESSAGE);
          input.value = "";
          fileValidRef.current = false;
        } else {
          fileValidRef.current = Boolean(file);
        }
        setSubmitEnabled(fileValidRef.current);
      });

      const form = input.closest("form");
      if (form) {
        form.addEventListener(
          "submit",
          (e) => {
            const file = input.files?.[0];
            if (!file || !isValidImageFile(file)) {
              e.preventDefault();
              e.stopImmediatePropagation();
              window.alert(ALERT_MESSAGE);
              input.value = "";
              fileValidRef.current = false;
              setSubmitEnabled(false);
            }
          },
          true,
        );
      }
    }

    // 初期状態を反映
    setSubmitEnabled(fileValidRef.current);
    return true;
  }, []);

  const createForm = useCallback(() => {
    if (createdRef.current || !window.hbspt) return;
    createdRef.current = true;
    window.hbspt.forms.create({
      region: "na2",
      portalId: "245762655",
      formId: "14d3688a-daa3-436b-a79e-428e97593df8",
      target: "#hubspotTarget",
      onFormReady: () => {
        // iframe の contentDocument が利用可能になるまで少し待つ
        if (!setupValidation()) {
          const interval = window.setInterval(() => {
            if (setupValidation()) window.clearInterval(interval);
          }, 300);
          window.setTimeout(() => window.clearInterval(interval), 8000);
        }
      },
    });
  }, [setupValidation]);

  useEffect(() => {
    // スクリプトが既に読み込まれていれば即生成
    if (window.hbspt) createForm();
  }, [createForm]);

  return (
    <main className="min-h-screen bg-white px-6 py-12 max-w-2xl mx-auto overflow-hidden">
      <Script
        src="https://js-na2.hsforms.net/forms/embed/v2.js"
        strategy="afterInteractive"
        onLoad={createForm}
      />
      <div className="">
        <h1 className="text-3xl text-center font-bold text-slate-800 mb-8">
          広告掲載のお問い合わせ
        </h1>
        <div id="hubspotTarget" />
      </div>
    </main>
  );
}
