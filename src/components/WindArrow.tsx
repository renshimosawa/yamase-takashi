"use client";

const COMPASS_16 = [
  "北",
  "北北東",
  "北東",
  "東北東",
  "東",
  "東南東",
  "南東",
  "南南東",
  "南",
  "南南西",
  "南西",
  "西南西",
  "西",
  "西北西",
  "北西",
  "北北西",
] as const;

/** 0〜360度を16方位の日本語ラベルに変換する（風が吹いてくる向き） */
export function degreesToCompass(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return COMPASS_16[index];
}

type WindArrowProps = {
  /** 気象の風向（風が吹いてくる向き）。0〜360度。null なら方位記号を表示。 */
  degrees: number | null | undefined;
  /** 矢印のサイズ(px)。デフォルト24。 */
  size?: number;
  className?: string;
};

/**
 * 0〜360度の数値をそのまま使い、連続的に回転する風向矢印を表示する。
 * 矢印は「風が吹いていく向き」を指す（北風＝下向き）。既存の8方位絵文字と同じ規約。
 */
export default function WindArrow({
  degrees,
  size = 24,
  className,
}: WindArrowProps) {
  if (degrees === null || degrees === undefined || Number.isNaN(degrees)) {
    return (
      <span
        className={className}
        style={{ fontSize: size * 0.8, lineHeight: 1 }}
        aria-label="風向不明"
      >
        🧭
      </span>
    );
  }

  const normalized = ((degrees % 360) + 360) % 360;
  // 風向は「吹いてくる向き」なので、矢印は +180° で「吹いていく向き」を指す
  const rotation = (normalized + 180) % 360;
  const compass = degreesToCompass(normalized);
  const label = `風向 ${compass}（${Math.round(normalized)}°）`;

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        width: size,
        height: size,
      }}
      title={label}
      role="img"
      aria-label={label}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: "transform 0.3s ease",
        }}
      >
        <line x1="12" y1="21" x2="12" y2="3" />
        <polyline points="6 9 12 3 18 9" />
      </svg>
    </span>
  );
}
