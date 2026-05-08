import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LpHeroRef from "@/components/LpHeroRef";

export const metadata: Metadata = {
  title: "ヤマセ君の知らせ｜八戸のヤマセと暮らし、つながる。",
  description:
    "八戸市民のアイデンティティ「ヤマセ」を可視化。匂いや霧の状況をみんなで共有し、憎めぬあいつ「ヤマセ君」と共に暮らすためのブラウザアプリ。",
  openGraph: {
    title: "ヤマセ君の知らせ｜八戸のヤマセと暮らし、つながる。",
    description:
      "八戸市民のアイデンティティ「ヤマセ」を可視化。匂いや霧の状況をみんなで共有し、憎めぬあいつ「ヤマセ君」と共に暮らすためのブラウザアプリ。",
    url: "https://yamasekun.jp/lp/",
    type: "website",
    images: [
      {
        url: "https://yamasekun.jp/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ヤマセ君の知らせ",
      },
    ],
  },
  alternates: {
    canonical: "https://yamasekun.jp/lp/",
  },
};

const faqs = [
  {
    q: "利用料金はかかりますか？",
    a: "無料です！すべての機能を無料でご利用いただけます。ヤマセを面白がる気持ちさえあれば、どなたでも歓迎です。なお、ご利用にはGoogleアカウントが必要となります。",
  },
  {
    q: "なぜGoogleアカウントでのログインが必要なのですか？",
    a: "自身の投稿の管理や、通知権限設定を行えるようにするためです。アカウント情報が一般に公開されることはありません。",
  },
  {
    q: "アプリのインストールは必要ですか？",
    a: "いいえ、ブラウザで動作するアプリですので、URLにアクセスするだけですぐにご利用いただけます。スマートフォンのホーム画面に追加していただくと、よりスムーズにアクセス可能です。",
  },
  {
    q: "位置情報の許可は必須ですか？",
    a: "はい。現在のヤマセの状況をリアルタイムに地図へ反映させるため、位置情報の利用をお願いしています。投稿は完全に匿名で行われるため、誰がどこから投稿したか特定されることはありません。",
  },
  {
    q: "八戸市以外でも使えますか？",
    a: "はい、どこでも利用可能です。地図上にはあなたの現在地が正しく反映されます。ただし、マップの初期表示は八戸の地図・天候となります。どこにいても八戸の空気感やヤマセの気配を感じられる仕様です。",
  },
  {
    q: "スマートフォンのホーム画面にアイコンを表示できますか？",
    a: "はい。ブラウザのメニューから「ホーム画面に追加」を選択していただくと、アプリと同じようにアイコンが表示され、ヤマセをすぐに確認できるようになります。",
  },
  {
    q: "広告を掲載することはできますか？",
    a: "可能です。地域の人々に情報を届けたい企業様や店舗様向けの広告枠をご用意しています。今後は位置情報に合わせて配信をコントロールする機能も予定しています。掲載をご希望の方は、お問い合わせください。",
  },
];

const characterParts = [
  { icon: "🦑", label: "ゲソ型のまゆげ", desc: "キリリと光る存在感" },
  { icon: "🌊", label: "ホヤのエンブレム", desc: "胸元に輝く八戸の誇り" },
  { icon: "🫔", label: "ゲソマフラー", desc: "霧になびく粋なアイテム" },
  { icon: "🐦", label: "かもめ帽子", desc: "粋に被る海の証" },
];

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden scroll-smooth">
      {/* ① Hero / FV */}
      <LpHeroRef>
        <section className="relative min-h-screen flex flex-col justify-center bg-gradient-to-br from-sky-100 via-cyan-50 to-slate-100 overflow-hidden">
          {/* 霧の装飾 */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[radial-gradient(ellipse_80%_60%_at_60%_40%,_#bae6fd,_transparent)]" />
            <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-sky-200 opacity-20 blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="flex-1 text-center md:text-left">
              <p className="inline-block text-xs font-bold tracking-widest text-cyan-700 bg-cyan-100 px-3 py-1 rounded-full mb-4">
                八戸発・天気でつながるコミュニティアプリ
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-slate-800">
                今日も憎めぬ
                <br />
                アイツがやってくる♡
              </h1>
              <p className="mt-4 text-lg text-slate-600 font-medium">
                ヤマセと暮らし、ヤマセでつながる。
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 bg-cyan-700 text-white text-base font-bold py-4 px-8 rounded-full hover:bg-cyan-600 transition-colors duration-200 shadow-lg"
                >
                  ヤマセ君と暮らす
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 bg-white text-cyan-700 text-base font-bold py-4 px-8 rounded-full border-2 border-cyan-200 hover:border-cyan-400 transition-colors duration-200"
                >
                  詳しく見る
                </a>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Image
                src="/yamasekun_base.png"
                alt="ヤマセ タケシ"
                width={320}
                height={320}
                className="drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* スクロールヒント */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-cyan-600 opacity-60">
            <span className="text-xs font-medium tracking-wider">SCROLL</span>
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
              <path
                d="M8 0v20M2 14l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </section>
      </LpHeroRef>

      {/* ② イントロ：ヤマセとは？ */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🌫️</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
              ヤマセとは？
            </h2>
          </div>
          <div className="space-y-5 text-slate-600 leading-relaxed text-base sm:text-lg">
            <p>
              梅雨〜夏を中心に、北海道や東北の太平洋岸に冷涼な夏をもたらす北東の風です。
              ですが、八戸市民にとって「ヤマセ」は、単なる気象現象ではありません。
            </p>
            <p>
              冷たく湿った北東の風が運んでくる、
              <strong className="text-slate-800">
                あの霧、あの匂い、あの肌寒さ
              </strong>
              。 時に冷害をもたらす「餓死風」と恐れられた歴史もありますが、
              それは私たちの日常に深く根ざした、切っても切れないアイデンティティでもあります。
            </p>
            <p>
              「あの匂い」と表現しましたが、その匂いは人それぞれ。
              「臭い」と表現した方がしっくりくることも。
              ヤマセは私たちがこの街で生きている証でもあります。
            </p>
            <blockquote className="border-l-4 border-cyan-400 pl-5 py-2 bg-cyan-50 rounded-r-xl italic text-slate-700 font-bold">
              「ヤマセと共に育った我々は、ヤマセを愛し、ヤマセと暮らす」
            </blockquote>
            <p>私たちは、そんなヤマセに愛着を込めて再定義しました。</p>
          </div>
        </div>
      </section>

      {/* ③ キャラクター紹介：ヤマセ タケシ */}
      <section className="bg-gradient-to-br from-slate-800 to-cyan-900 py-20 px-6 text-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-cyan-300 text-sm font-bold tracking-widest mb-2">
            CHARACTER
          </p>
          <h2 className="text-center text-2xl sm:text-3xl font-black mb-3">
            だけど、なんだか憎めぬアイツ
          </h2>
          <p className="text-center text-3xl sm:text-4xl font-black text-cyan-300 mb-12">
            ヤマセ タケシ
          </p>

          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            {/* キャラクター画像群 */}
            <div className="flex-shrink-0">
              <div className="flex items-end gap-2">
                {["yamase_00", "yamase_01", "yamase_02", "yamase_03"].map(
                  (name, i) => (
                    <div
                      key={name}
                      className="flex flex-col items-center gap-1"
                      style={{ opacity: 0.5 + i * 0.17 }}
                    >
                      <Image
                        src={`/yamasekun/${name}.png`}
                        alt={`ヤマセ強度 ${i}`}
                        width={i === 3 ? 100 : 64 + i * 10}
                        height={i === 3 ? 100 : 64 + i * 10}
                        className="drop-shadow-lg"
                      />
                      <span className="text-xs text-cyan-300 font-bold">
                        Lv.{i}
                      </span>
                    </div>
                  ),
                )}
              </div>
              <p className="text-center text-xs text-cyan-400 mt-3">
                平均強度によって姿が変わります
              </p>
            </div>

            <div className="flex-1 space-y-5">
              <p className="text-slate-200 leading-relaxed">
                厄介者の「ヤマセ」を、寒さ・霧・独特な匂いを引き起こすトラブルメーカー
                ——それでも憎めぬ、キザなやつとして定義しました。
              </p>
              <p className="text-slate-200 leading-relaxed">
                街にあの匂いが広がったら、それはヤマセ君が遊びに来た合図です。
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4">
                {characterParts.map((part) => (
                  <div
                    key={part.label}
                    className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10"
                  >
                    <div className="text-2xl mb-1">{part.icon}</div>
                    <div className="text-sm font-bold text-white">
                      {part.label}
                    </div>
                    <div className="text-xs text-cyan-300 mt-0.5">
                      {part.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ④ 機能紹介 */}
      <section id="features" className="bg-slate-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-cyan-600 text-sm font-bold tracking-widest mb-2">
            FEATURES
          </p>
          <h2 className="text-center text-2xl sm:text-3xl font-black text-slate-800 mb-3">
            機能紹介
          </h2>
          <p className="text-center text-slate-500 mb-12 text-sm">
            ただの天気予報ではない、ワクワクをどうぞ。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center text-2xl">
                🗺️
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  状況の可視化
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  マップ上で現在のヤマセ発生状況を一目でチェック。
                  平均強度によってヤマセ君の姿が変わります。
                </p>
              </div>
              <div className="mt-auto flex justify-center">
                <Image
                  src="/yamasekun/yamase_03.png"
                  alt="マップ可視化"
                  width={80}
                  height={80}
                  className="opacity-80"
                />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center text-2xl">
                👃
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  「匂い」でつながる報告
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  「鉄の匂い」「ホヤの匂い」「ウミネコの匂い」。
                  八戸特有の感覚をレベル別にリアルタイム投稿。
                </p>
              </div>
              <div className="mt-auto flex items-end justify-center gap-2">
                {["hoya", "iron", "umineko"].map((icon) => (
                  <Image
                    key={icon}
                    src={`/smell-icon/${icon}.png`}
                    alt={icon}
                    width={48}
                    height={48}
                    className="drop-shadow-sm"
                  />
                ))}
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center text-2xl">
                📣
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                  ヤマセと共に届く広告
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  八戸に暮らす皆さんと情報をつなぎます。
                  位置情報に連動した地域情報を届けます。
                </p>
              </div>
              <div className="mt-auto flex justify-center">
                <Image
                  src="/ad_secTitle.png"
                  alt="広告機能"
                  width={140}
                  height={50}
                  className="object-contain opacity-80"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ⑤ 背景：八戸ハッカソン発 */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-cyan-600 text-sm font-bold tracking-widest mb-2">
            ORIGIN
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-6">
            八戸アイディアソン・ハッカソン発
          </h2>
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold px-4 py-2 rounded-full mb-8">
            🏆 八戸アイディアソン・ハッカソン2025 最優秀賞
          </div>
          <p className="text-slate-600 leading-relaxed text-base sm:text-lg mb-8">
            このアプリは「八戸アイディアソン・ハッカソン2025」から生まれました。
            地元の課題を面白がり、テクノロジーで解決するために開発。
            地域への愛と遊び心から始まった、八戸専用のコミュニケーションツールです。
          </p>
          <a
            href="https://8nohe-ikiikidx.jp/event20250930/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-slate-800 text-white font-bold py-3 px-7 rounded-full hover:bg-slate-700 transition-colors duration-200 text-sm"
          >
            ハッカソンの活動詳細を見る →
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-cyan-600 text-sm font-bold tracking-widest mb-2">
            FAQ
          </p>
          <h2 className="text-center text-2xl sm:text-3xl font-black text-slate-800 mb-10">
            よくある質問
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group bg-white rounded-xl border border-slate-200 open:border-cyan-300 transition-all"
              >
                <summary className="flex items-start gap-3 cursor-pointer px-5 py-4 font-bold text-slate-800 list-none text-sm sm:text-base">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-black flex items-center justify-center mt-0.5">
                    Q
                  </span>
                  <span className="flex-1">{faq.q}</span>
                  <svg
                    className="flex-shrink-0 mt-1 w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-200"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M4 6l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </summary>
                <div className="px-5 pb-5 flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-700 text-white text-xs font-black flex items-center justify-center mt-0.5">
                    A
                  </span>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section
        id="lp-bottom-cta"
        className="bg-gradient-to-br from-cyan-700 to-slate-800 py-20 px-6 text-white text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-black mb-3">
          さあ、ヤマセ君と暮らそう。
        </h2>
        <p className="text-cyan-200 mb-8 text-sm sm:text-base">
          無料で、今すぐ始められます。
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white text-cyan-800 font-black py-4 px-10 rounded-full hover:bg-cyan-50 transition-colors duration-200 text-base shadow-xl"
        >
          ヤマセ君と暮らす
        </Link>
        <p className="mt-6 text-xs text-cyan-400">
          ご利用にはGoogleアカウントが必要です。利用料金は無料です。
        </p>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-center text-xs">
        <p>© 2025 ヤマセ君の知らせ — 八戸アイディアソン・ハッカソン2025</p>
      </footer>
    </main>
  );
}
