"use client";

export default function AdContactThanksPage() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <p className="text-sm font-semibold tracking-widest text-cyan-700 uppercase">
          送信されました！
        </p>
        <h1 className="text-3xl font-bold text-slate-800">送信完了！</h1>
        <div className="space-y-2 text-slate-600 leading-relaxed">
          <p>お問い合わせありがとうございました。</p>
          <p>
            内容を確認の上、入力いただいたメールアドレスにご連絡差し上げます。
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-block mt-4 text-cyan-700 underline hover:text-cyan-900 text-sm"
        >
          → 元のページに戻る
        </button>
      </div>
    </main>
  );
}
