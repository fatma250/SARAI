/**
 * JS-side mirror of the categorical palette in statistics-tokens.css.
 * SVG fill/stroke attributes (as opposed to CSS `style`) don't reliably
 * resolve `var(--...)` across browsers, so chart components that need a
 * literal color (Recharts <Cell fill=...>, inline SVG) import from here
 * instead of the CSS variables. Keep this in sync with statistics-tokens.css
 * if you ever change the palette.
 */

export const CHART_COLORS_LIGHT = {
  series1: "#2a78d6", // blue
  series2: "#eb6834", // orange
  series3: "#1baf7a", // aqua
  series4: "#eda100", // yellow
  series5: "#e87ba4", // magenta
  series6: "#008300", // green
  other: "#c3c2b7",
  textPrimary: "#10131a",
  textSecondary: "#565b6b",
  textMuted: "#898781",
  gridline: "#e7e9f1",
  surface1: "#ffffff",
  surface2: "#f6f7fb",
};

export const CHART_COLORS_DARK = {
  series1: "#3987e5",
  series2: "#d95926",
  series3: "#199e70",
  series4: "#c98500",
  series5: "#d55181",
  series6: "#1aa11a",
  other: "#45464f",
  textPrimary: "#ffffff",
  textSecondary: "#c3c2b7",
  textMuted: "#898781",
  gridline: "#2a2b33",
  surface1: "#16171f",
  surface2: "#1c1e27",
};

/** Fixed order - assign by index, never reshuffle per filter/selection. */
export function seriesColorList(colors) {
  return [colors.series1, colors.series2, colors.series3, colors.series4, colors.series5, colors.series6];
}

export function getChartColors(isDark) {
  return isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;
}
