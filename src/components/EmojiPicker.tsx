"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import {
  EmojiStyle,
  Theme,
  type EmojiClickData,
  type PickerProps,
} from "emoji-picker-react";
type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
  className?: string;
};

const EmojiPickerComponent = dynamic<PickerProps>(
  () => import("emoji-picker-react"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-white/10 bg-black/80 p-4 text-center text-sm text-white/80">
        絵文字を読み込み中…
      </div>
    ),
  }
);

export default function EmojiPicker({ onSelect, className }: EmojiPickerProps) {
  const pickerProps = useMemo<PickerProps>(
    () => ({
      onEmojiClick: (emojiData: EmojiClickData) => {
        onSelect(emojiData.emoji);
      },
      lazyLoadEmojis: true,
      emojiStyle: EmojiStyle.NATIVE,
      theme: Theme.DARK,
      autoFocusSearch: true,
      previewConfig: {
        showPreview: false,
      },
      width: "100%",
      height: "430px",
      skinTonesDisabled: false,
      searchPlaceHolder: "絵文字を検索",
    }),
    [onSelect]
  );

  return (
    <div
      className={[
        "rounded-2xl border border-white/15 bg-black/90 p-2 text-white shadow-2xl backdrop-blur-md",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <EmojiPickerComponent {...pickerProps} />
    </div>
  );
}
