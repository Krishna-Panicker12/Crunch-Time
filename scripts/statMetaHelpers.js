import { STAT_META } from "./statMeta";

export function getStatMeta(position, key) {
  return STAT_META?.[position]?.[key] || null;
}

export function getStatLabel(position, key) {
  return getStatMeta(position, key)?.label || key;
}

export function getStatBetter(position, key) {
  return getStatMeta(position, key)?.better || "higher";
}

export function getStatKeysForPosition(position) {
  return Object.keys(STAT_META?.[position] || {});
}