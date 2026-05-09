import path from "node:path";
import { modeIds, type Mode } from "../domain/taxonomy";
import { skinKinds, type SkinKind } from "../domain/skin-asset";
import { titleizeIdentifier } from "../domain/label";

const imageExts = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const audioExts = new Set([".wav", ".ogg", ".mp3"]);
const textExts = new Set([".ini", ".json", ".txt", ".md"]);
const fontExts = new Set([".ttf", ".otf", ".fnt"]);

export type SequenceInfo = {
  familyKey: string;
  familyLabel: string;
  sequenceIndex: number | null;
};

export function toPosixPath(value: string): string {
  return value.replaceAll("\\", "/");
}

export function normalizeSeparators(value: string): string {
  return toPosixPath(value);
}

export function basenameOf(relativePath: string): string {
  return toPosixPath(relativePath).split("/").at(-1) ?? relativePath;
}

export function extensionOf(relativePath: string): string {
  return path.extname(basenameOf(relativePath)).toLowerCase();
}

export function stripScaleSuffix(fileName: string): string {
  const ext = path.extname(fileName);
  const stem = fileName.slice(0, fileName.length - ext.length);
  return `${stem.endsWith("@2x") ? stem.slice(0, -3) : stem}${ext}`;
}

export function stripAnimationSuffix(fileName: string): string {
  const ext = path.extname(fileName);
  const stem = fileName.slice(0, fileName.length - ext.length);

  const numberedDash = stem.match(/^(.*?)-(\d+)$/);
  if (numberedDash) return `${numberedDash[1]}${ext}`;

  const sliderBallFrame = stem.match(/^(sliderb)(\d+)$/);
  if (sliderBallFrame) return `${sliderBallFrame[1]}${ext}`;

  return fileName;
}

export function canonicalKey(relativePath: string): string {
  const parts = toPosixPath(relativePath).toLowerCase().split("/");
  parts[parts.length - 1] = stripScaleSuffix(parts[parts.length - 1]);
  return parts.join("/");
}

export function logicalSkinKey(relativePath: string): string {
  const parts = canonicalKey(relativePath).split("/");
  parts[parts.length - 1] = stripAnimationSuffix(parts[parts.length - 1]);
  return parts.join("/");
}

export function withoutExtension(fileName: string): string {
  const ext = path.extname(fileName);
  return ext ? fileName.slice(0, -ext.length) : fileName;
}

export { titleizeIdentifier };

export function sequenceInfo(relativePath: string): SequenceInfo {
  const fileName = basenameOf(logicalSkinKey(relativePath));
  let stem = stripScaleSuffix(withoutExtension(fileName));

  const numberedDash = stem.match(/^(.*?)-(\d+)$/);
  if (numberedDash) {
    stem = numberedDash[1];
    return {
      familyKey: stem.toLowerCase(),
      familyLabel: titleizeIdentifier(stem),
      sequenceIndex: Number(numberedDash[2]),
    };
  }

  const sliderBallFrame = stem.match(/^(sliderb)(\d+)$/);
  if (sliderBallFrame) {
    return {
      familyKey: sliderBallFrame[1].toLowerCase(),
      familyLabel: titleizeIdentifier(sliderBallFrame[1]),
      sequenceIndex: Number(sliderBallFrame[2]),
    };
  }

  return {
    familyKey: stem.toLowerCase(),
    familyLabel: titleizeIdentifier(stem),
    sequenceIndex: null,
  };
}

export function kindFor(relativePath: string): SkinKind {
  const ext = extensionOf(relativePath);

  if (imageExts.has(ext)) return "image";
  if (audioExts.has(ext)) return "audio";
  if (textExts.has(ext)) return "text";
  if (fontExts.has(ext)) return "font";

  return "other";
}

export function isKnownSkinKind(value: string): value is SkinKind {
  return (skinKinds as readonly string[]).includes(value);
}

export function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[|\\{}()[\]^$+?.]/g, "\\$&")
    .replaceAll("*", ".*");

  return new RegExp(`^${escaped}$`);
}

export function nameMatches(
  relativePath: string,
  patterns: readonly string[],
  options: { logical?: boolean } = {},
): boolean {
  const key = options.logical ? logicalSkinKey(relativePath) : canonicalKey(relativePath);
  const basename = key.split("/").at(-1) ?? key;

  return patterns.some((pattern) => {
    const lower = pattern.toLowerCase();
    const target = lower.includes("/") ? key : basename;
    return globToRegExp(lower).test(target);
  });
}

export function matchesAnyPattern(relativePath: string, patterns: readonly string[]): boolean {
  return nameMatches(relativePath, patterns, { logical: true });
}

export const modeDetectionPatterns: Record<Mode, string[]> = {
  osu: [
    "approachcircle*",
    "default-*",
    "followpoint*",
    "hit0*",
    "hit50*",
    "hit100*",
    "hit300*",
    "hitcircle*",
    "hitcircleoverlay*",
    "lighting*",
    "reversearrow*",
    "slider*",
    "sliderscorepoint*",
    "sliderb*",
    "spinner-*",
    "spinner_*",
    "spinnerspin*",
    "cursor*",
    "cursors/*",
    "play-skip*",
  ],
  taiko: [
    "drum-*",
    "lighting*",
    "taiko-*",
    "taikobigcircle*",
    "taikohitcircle*",
    "taiko/*",
    "spinner-warning*",
    "spinner-circle*",
    "spinner-approachcircle*",
  ],
  catch: ["fruit-*", "comboburst-fruits*", "lighting*"],
  mania: [
    "mania-*",
    "comboburst-mania*",
    "lightingg*",
    "lightingl*",
    "lightingn*",
  ],
};

export function matchesMode(relativePath: string, mode: Mode): boolean {
  return nameMatches(relativePath, modeDetectionPatterns[mode], { logical: true });
}

export function modesFor(relativePath: string): Mode[] {
  return modeIds.filter((mode) => matchesMode(relativePath, mode));
}

export function hasScaleSuffix(relativePath: string): boolean {
  return /@2x\.[^.]+$/i.test(basenameOf(relativePath));
}

export function isAnimationFrame(relativePath: string): boolean {
  const fileName = basenameOf(canonicalKey(relativePath));
  const stem = withoutExtension(fileName);
  return /-\d+$/.test(stem) || /^sliderb\d+$/.test(stem);
}
