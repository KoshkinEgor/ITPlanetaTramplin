const FONT_WEIGHT_CLASS_MAP = {
  medium: "ui-font-weight-medium",
};

const WIDTH_CLASS_MAP = {
  full: "ui-width-full",
};

export function getFontWeightClassName(fontWeight) {
  return FONT_WEIGHT_CLASS_MAP[fontWeight] ?? "";
}

export function getWidthClassName(width) {
  return WIDTH_CLASS_MAP[width] ?? "";
}
