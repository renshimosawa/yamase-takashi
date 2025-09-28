"use client";

import type { MapPostGroup } from "./OpenStreetMap";
import {
  getSmellIconPath,
  SMELL_TYPE_LABELS,
  type SmellType,
} from "@/constants/smell";

type PostDetailSheetProps = {
  group: MapPostGroup | null;
  onClose: () => void;
};

export default function PostDetailSheet({
  group,
  onClose,
}: PostDetailSheetProps) {
  if (!group) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[1500] flex items-end justify-center pb-0">
      <div className="pointer-events-auto w-full max-w-2xl translate-y-0 rounded-t-3xl bg-white p-6 pb-0 text-slate-900 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              投稿詳細
            </p>
            <p className="text-sm text-slate-600">
              緯度: {group.latitude.toFixed(6)}｜経度:{" "}
              {group.longitude.toFixed(6)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="閉じる"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {group.posts.map((post) => (
            <li key={post.id} className="rounded-2xl bg-slate-100 p-4">
              <div className="mb-2 flex items-center gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <img
                    src={getSmellIconPath(post.smell_type ?? "hoya")}
                    alt={
                      SMELL_TYPE_LABELS[
                        (post.smell_type ?? "hoya") as SmellType
                      ]
                    }
                    className="h-8 w-8 rounded-full border border-slate-200 bg-slate-50 object-contain p-1"
                  />
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-700">
                    Lv.{post.intensity ?? "-"}
                  </span>
                </div>
                {post.inserted_at && (
                  <span className="text-xs text-slate-500">
                    {new Date(post.inserted_at).toLocaleString("ja-JP")}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-800">{post.description}</p>
            </li>
          ))}
        </ul>
        <hr className="my-4 border-slate-200" />
        <div className="relative mx-auto overflow-hidden rounded-2xl bg-white">
          <div className="absolute inset-0 z-0 pointer-events-none bg-[url('/wind.png')] bg-[length:170px] bg-[position:center_top_6rem] bg-no-repeat opacity-40" />
          <div className="relative z-10">
            <img
              src="/ad_secTitle.png"
              alt="ad_secTitle"
              className="w-[360px]"
            />
            <img src="demo_ad.png" alt="" className="w-[360px]" />
          </div>
          <img src="ad_secBG.png" alt="" className="relative z-10" />
          <img
            src="yamasekun_base.png"
            alt="ヤマセタカシくん"
            className="absolute bottom-0 right-[-30px] z-20 w-[160px]"
          />
        </div>
      </div>
    </div>
  );
}
