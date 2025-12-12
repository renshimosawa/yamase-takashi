export const SMELL_ICON_BASE_PATH = "/smell-icon";

export const SMELL_TYPE_ORDER = [
  "hoya",
  "iron",
  "umineko",
  "dog_food",
] as const;

export type SmellType = (typeof SMELL_TYPE_ORDER)[number];

export type NeutralSmellEmoji = string;
export const NEUTRAL_SMELL_EMOJI: NeutralSmellEmoji = "😊";
export type SmellSummaryValue = SmellType | NeutralSmellEmoji;

export const SMELL_TYPE_LABELS: Record<SmellType, string> = {
  hoya: "ホヤ",
  iron: "鉄",
  umineko: "ウミネコ",
  dog_food: "ドッグフード",
};

export const SMELL_TYPE_ICON_PATHS: Record<SmellType, string> = {
  hoya: `${SMELL_ICON_BASE_PATH}/hoya.png`,
  iron: `${SMELL_ICON_BASE_PATH}/iron.png`,
  umineko: `${SMELL_ICON_BASE_PATH}/umineko.png`,
  dog_food: `${SMELL_ICON_BASE_PATH}/dog_food.png`,
};

export type SmellOption = {
  value: SmellType;
  label: string;
  icon: string;
};

export const SMELL_TYPE_OPTIONS: SmellOption[] = SMELL_TYPE_ORDER.map(
  (value) => ({
    value,
    label: SMELL_TYPE_LABELS[value],
    icon: SMELL_TYPE_ICON_PATHS[value],
  })
);

export const isValidSmellType = (
  value: string | null | undefined
): value is SmellType => SMELL_TYPE_ORDER.includes(value as SmellType);

export const getSmellIconPath = (smellType: SmellType | null | undefined) =>
  smellType && SMELL_TYPE_ICON_PATHS[smellType]
    ? SMELL_TYPE_ICON_PATHS[smellType]
    : SMELL_TYPE_ICON_PATHS.hoya;

export const isValidNeutralSmellEmoji = (
  value: string | null | undefined
): value is NeutralSmellEmoji => {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  const graphemes =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? Array.from(
          new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(
            trimmed
          ),
          (segment) => segment.segment
        )
      : Array.from(trimmed);

  if (graphemes.length !== 1) {
    return false;
  }

  const emojiRegex =
    /^\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*$/u;
  return emojiRegex.test(trimmed);
};
