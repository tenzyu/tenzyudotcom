import type { TaxonomyPath } from "./taxonomy-path";
import type { SkinKind, SkinMeaning } from "./skin-asset";

export function emptySkinMeaning(): SkinMeaning {
  return {
    lazerLegacy: false,
    lazerNative: false,
    stable: false,
  };
}

export function mergeSkinMeaning(target: SkinMeaning, source: SkinMeaning): SkinMeaning {
  return {
    lazerLegacy: target.lazerLegacy || source.lazerLegacy,
    lazerNative: target.lazerNative || source.lazerNative,
    stable: target.stable || source.stable,
  };
}

export function preferSkinKind<T extends SkinKind | "empty">(current: T, next: SkinKind): SkinKind {
  if (current === "empty") return next;
  if (current === "image" || next === "image") return "image";
  if (current === "audio" || next === "audio") return "audio";
  if (current === "text" || next === "text") return "text";
  if (current === "font" || next === "font") return "font";
  return current;
}

export function compareTaxonomyPathOrder(a: TaxonomyPath, b: TaxonomyPath): number {
  return (
    a.scope.order - b.scope.order ||
    a.category.order - b.category.order ||
    a.group.order - b.group.order ||
    a.group.label.localeCompare(b.group.label) ||
    a.key.localeCompare(b.key)
  );
}

