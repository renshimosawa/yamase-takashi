export const SMELL_ICON_BASE_PATH = "/smell-icon";

export const SMELL_TYPE_ORDER = [
  "hoya",
  "iron",
  "umineko",
  "dog_food",
] as const;

export type SmellType = (typeof SMELL_TYPE_ORDER)[number];

export const NEUTRAL_SMELL_KEY = "_neutral" as const;
export const NEUTRAL_SMELL_EMOJI = "😊";
export type SmellSummaryValue = SmellType | typeof NEUTRAL_SMELL_KEY;

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
