"use client";

import Script from "next/script";

export default function AdContactPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12 max-w-2xl mx-auto overflow-hidden">
      <div className="">
        <h1 className="text-3xl text-center font-bold text-slate-800">
          広告掲載のお問い合わせ
        </h1>
        <Script
          src="https://js-na2.hsforms.net/forms/embed/245762655.js"
          strategy="afterInteractive"
        />
        <div
          className="hs-form-frame"
          data-region="na2"
          data-form-id="e280ba3e-c506-47fb-a202-4fb4a06c24a9"
          data-portal-id="245762655"
        />
      </div>
    </main>
  );
}
