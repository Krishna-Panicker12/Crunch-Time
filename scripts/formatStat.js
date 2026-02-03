export function formatStat(value, format = "raw") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  const v = Number(value);

  switch (format) {
    case "int":
      return String(Math.round(v));

    case "float1":
      return v.toFixed(1);

    case "float2":
      return v.toFixed(2);

    // expects value already like 73.3 (not 0.733)
    case "pct1":
      return `${v.toFixed(1)}%`;

    // expects value already like 0.22 (EPA/play, etc.)
    case "signed2":
      return `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;

    default:
      return String(v);
  }
}
