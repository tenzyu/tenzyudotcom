import { copyFile, mkdir, readFile, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";

export const modes = ["osu", "taiko", "catch", "mania"] as const;
export type Mode = (typeof modes)[number];

export const scopes = [
  "std",
  "mania",
  "catch",
  "taiko",
  "interface",
  "fonts",
  "configs",
  "sounds",
  "stable",
  "extras",
] as const;
export type Scope = (typeof scopes)[number];

export type SkinKind = "image" | "audio" | "text" | "font" | "other";
export type LazerMeaning = true | false;
export type RequiredLevel = "required" | "recommended" | "optional";

export type SkinClassification = {
  ruleId: string;
  componentId: string;
  requiredLevel: RequiredLevel;
  scope: Scope;
  category: string;
  groupKey: string;
  groupLabel: string;
  sequenceIndex: number | null;
  modes: Mode[];
  kind: SkinKind;
  lazerMeaningful: LazerMeaning;
};

export type SkinFile = SkinClassification & {
  root: string;
  relativePath: string;
  fullPath: string;
};

export const alwaysKeep = new Set(["skin.ini"]);

const imageExts = new Set([".png", ".jpg", ".jpeg"]);
const audioExts = new Set([".wav", ".ogg", ".mp3"]);
const textExts = new Set([".ini", ".json", ".txt"]);
const fontExts = new Set([".ttf", ".otf", ".fnt"]);

const modePatterns: Record<Mode, string[]> = {
  osu: [
    "approachcircle*",
    "comboburst*",
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
  ],
  taiko: [
    "approachcircle*",
    "drum-*",
    "lighting*",
    "pippidon*",
    "taiko-*",
    "taikobigcircle*",
    "taikohitcircle*",
    "taiko/*",
  ],
  catch: ["comboburst-fruits*", "fruit-*", "lighting*"],
  mania: [
    "comboburst-mania*",
    "lightingg*",
    "lightingl*",
    "lightingn*",
    "mania-*",
  ],
};

export type Rule = {
  id?: string;
  scope: Scope;
  category: string;
  label: string;
  patterns: string[];
  lazerMeaningful: LazerMeaning;
  componentId?: string;
  requiredLevel?: RequiredLevel;
};

export const classificationRules: Rule[] = [
  {
    scope: "configs",
    category: "skin-ini",
    label: "skin.ini",
    patterns: ["skin.ini"],
    lazerMeaningful: true,
  },
  {
    scope: "configs",
    category: "lazer-layouts",
    label: "lazer layout JSON",
    patterns: ["*.json"],
    lazerMeaningful: true,
  },

  {
    scope: "fonts",
    category: "font-files",
    label: "font files",
    patterns: ["*.ttf", "*.otf", "*.fnt"],
    lazerMeaningful: false,
  },

  {
    scope: "stable",
    category: "ranking",
    label: "ranking",
    patterns: ["ranking-*"],
    lazerMeaningful: false,
  },
  {
    scope: "stable",
    category: "classic-menu",
    label: "classic menu",
    patterns: [
      "button-*",
      "menu-back*",
      "menu-background*",
      "menu-snow*",
      "options-offset-tick*",
    ],
    lazerMeaningful: false,
  },
  {
    scope: "stable",
    category: "songselect",
    label: "songselect",
    patterns: [
      "songselect-*",
      "menu-button-background*",
      "rank-forum*",
      "star.png",
    ],
    lazerMeaningful: false,
  },
  {
    scope: "stable",
    category: "mode-icons",
    label: "mode icons",
    patterns: ["mode-osu*", "mode-taiko*", "mode-fruits*", "mode-mania*"],
    lazerMeaningful: false,
  },
  {
    scope: "stable",
    category: "mod-icons",
    label: "mod icons",
    patterns: ["selection-mod-*"],
    lazerMeaningful: false,
  },
  {
    scope: "stable",
    category: "selection",
    label: "selection",
    patterns: [
      "selection-mode*",
      "selection-mods*",
      "selection-random*",
      "selection-options*",
      "selection-tab*",
    ],
    lazerMeaningful: false,
  },
  {
    scope: "stable",
    category: "pause-fail",
    label: "pause and fail",
    patterns: ["pause-*", "fail-background*"],
    lazerMeaningful: false,
  },
  {
    scope: "stable",
    category: "break-editor",
    label: "break and editor",
    patterns: [
      "section-pass*",
      "section-fail*",
      "play-warningarrow*",
      "arrow-*",
      "play-unranked*",
      "multi-skipped*",
      "masking-border*",
      "hitcircleselect*",
    ],
    lazerMeaningful: false,
  },
  {
    scope: "stable",
    category: "countdown-images",
    label: "countdown images",
    patterns: ["count1.png", "count2.png", "count3.png", "go.png", "ready.png"],
    lazerMeaningful: false,
  },
  {
    scope: "stable",
    category: "decorative",
    label: "decorative",
    patterns: ["comboburst*", "taiko-flower-group*", "taiko-hit300g*"],
    lazerMeaningful: false,
  },
  {
    scope: "stable",
    category: "classic-ui-sounds",
    label: "classic UI sounds",
    patterns: [
      "applause.*",
      "pause-loop.*",
      "comboburst*.*",
      "sliderbar.*",
      "whoosh.*",
      "back-button-hover.*",
      "click-short.*",
      "menuclick.*",
      "menu-*-hover.*",
      "pause-hover.*",
      "pause-*-hover.*",
      "key-*.*",
      "heartbeat.*",
      "seeya.*",
      "welcome.*",
      "metronomelow.*",
      "match-*.*",
    ],
    lazerMeaningful: false,
  },

  {
    scope: "interface",
    category: "global",
    label: "global",
    patterns: ["welcome_text*", "star2*"],
    lazerMeaningful: true,
  },
  {
    scope: "std",
    category: "cursor",
    label: "cursor",
    patterns: [
      "cursor.png",
      "cursormiddle.png",
      "cursortrail.png",
      "cursor-smoke.png",
      "cursor-ripple.png",
      "cursors/*",
    ],
    lazerMeaningful: true,
  },
  {
    scope: "interface",
    category: "input-overlay",
    label: "input overlay",
    patterns: ["inputoverlay-background*", "inputoverlay-key*"],
    lazerMeaningful: true,
  },
  {
    scope: "interface",
    category: "health-display",
    label: "health display",
    patterns: [
      "scorebar-bg*",
      "scorebar-colour*",
      "scorebar-marker*",
      "scorebar-ki*",
      "scorebar-kidanger*",
    ],
    lazerMeaningful: true,
  },
  {
    scope: "interface",
    category: "judgements",
    label: "judgements",
    patterns: ["hit0*", "hit50*", "hit100*", "hit300*"],
    lazerMeaningful: true,
  },
  {
    scope: "interface",
    category: "particles",
    label: "particles",
    patterns: ["particle50*", "particle100*", "particle300*"],
    lazerMeaningful: true,
  },
  {
    scope: "fonts",
    category: "score",
    label: "score font",
    patterns: ["score-*"],
    lazerMeaningful: true,
  },
  {
    scope: "fonts",
    category: "combo",
    label: "combo font",
    patterns: ["combo-*"],
    lazerMeaningful: true,
  },
  {
    scope: "fonts",
    category: "default-numbers",
    label: "default numbers",
    patterns: ["default-*"],
    lazerMeaningful: true,
  },
  {
    scope: "fonts",
    category: "score-entry",
    label: "score entry font",
    patterns: ["scoreentry-*"],
    lazerMeaningful: true,
  },

  {
    scope: "mania",
    category: "hit-bursts",
    label: "hit bursts",
    patterns: [
      "mania-hit0*",
      "mania-hit50*",
      "mania-hit100*",
      "mania-hit200*",
      "mania-hit300*",
      "mania-hit300g*",
    ],
    lazerMeaningful: true,
  },
  {
    scope: "mania",
    category: "comboburst",
    label: "comboburst",
    patterns: ["comboburst-mania*"],
    lazerMeaningful: true,
  },
  {
    scope: "mania",
    category: "keys",
    label: "keys",
    patterns: ["mania-key*"],
    lazerMeaningful: true,
  },
  {
    scope: "mania",
    category: "notes",
    label: "notes",
    patterns: ["mania-note*"],
    lazerMeaningful: true,
  },
  {
    scope: "mania",
    category: "stage",
    label: "stage",
    patterns: ["mania-stage*", "mania-warningarrow*"],
    lazerMeaningful: true,
  },
  {
    scope: "mania",
    category: "lighting",
    label: "lighting",
    patterns: ["mania-light*", "lightingg*", "lightingl*", "lightingn*"],
    lazerMeaningful: true,
  },

  {
    scope: "stable",
    category: "decorative",
    label: "decorative",
    patterns: ["pippidon*"],
    lazerMeaningful: false,
  },
  {
    scope: "taiko",
    category: "hit-bursts",
    label: "hit bursts",
    patterns: [
      "taiko-hit0*",
      "taiko-hit100*",
      "taiko-hit100k*",
      "taiko-hit300*",
      "taiko-hit300k*",
    ],
    lazerMeaningful: true,
  },
  {
    scope: "taiko",
    category: "notes",
    label: "notes",
    patterns: ["taikohitcircle*", "taikobigcircle*"],
    lazerMeaningful: true,
  },
  {
    scope: "taiko",
    category: "playfield-upper",
    label: "playfield upper",
    patterns: ["taiko-slider.png", "taiko-slider-fail.png", "taiko-glow.png"],
    lazerMeaningful: true,
  },
  {
    scope: "taiko",
    category: "playfield-lower",
    label: "playfield lower",
    patterns: [
      "taiko-bar-left*",
      "taiko-drum-inner*",
      "taiko-drum-outer*",
      "taiko-bar-right*",
      "taiko-bar-right-glow*",
      "taiko-barline*",
    ],
    lazerMeaningful: true,
  },
  {
    scope: "taiko",
    category: "drumrolls",
    label: "drumrolls",
    patterns: ["taiko-roll-middle*", "taiko-roll-end*"],
    lazerMeaningful: true,
  },
  {
    scope: "taiko",
    category: "shaker",
    label: "shaker",
    patterns: [
      "spinner-warning*",
      "spinner-circle*",
      "spinner-approachcircle*",
    ],
    lazerMeaningful: true,
  },

  {
    scope: "catch",
    category: "catcher",
    label: "catcher",
    patterns: ["fruit-catcher-*", "fruit-ryuuta*"],
    lazerMeaningful: true,
  },
  {
    scope: "catch",
    category: "fruits",
    label: "fruits",
    patterns: [
      "fruit-pear*",
      "fruit-grapes*",
      "fruit-apple*",
      "fruit-orange*",
      "fruit-bananas*",
      "fruit-drop*",
      "fruit-droplet*",
    ],
    lazerMeaningful: true,
  },
  {
    scope: "catch",
    category: "particles",
    label: "particles",
    patterns: ["lighting*"],
    lazerMeaningful: true,
  },

  {
    scope: "std",
    category: "hit-circles",
    label: "hit circles",
    patterns: [
      "approachcircle*",
      "hitcircle*",
      "hitcircleoverlay*",
      "followpoint*",
    ],
    lazerMeaningful: true,
  },
  {
    scope: "std",
    category: "slider",
    label: "slider",
    patterns: [
      "sliderendcircle*",
      "sliderendcircleoverlay*",
      "sliderfollowcircle*",
      "sliderb*",
      "sliderb-nd*",
      "sliderb-spec*",
      "sliderscorepoint*",
      "reversearrow*",
      "sliderpoint10*",
      "sliderpoint30*",
    ],
    lazerMeaningful: true,
  },
  {
    scope: "std",
    category: "slider-miss-indicators",
    label: "slider miss indicators",
    patterns: ["sliderendmiss*", "slidertickmiss*"],
    lazerMeaningful: true,
  },
  {
    scope: "std",
    category: "particles",
    label: "particles",
    patterns: ["lighting*"],
    lazerMeaningful: true,
  },
  {
    scope: "std",
    category: "spinner",
    label: "spinner",
    patterns: [
      "spinner-rpm*",
      "spinner-clear*",
      "spinner-spin*",
      "spinner-background*",
      "spinner-metre*",
      "spinner-osu*",
      "spinner-glow*",
      "spinner-bottom*",
      "spinner-top*",
      "spinner-middle*",
      "spinner-middle2*",
    ],
    lazerMeaningful: true,
  },
  {
    scope: "std",
    category: "intro",
    label: "intro",
    patterns: ["play-skip*"],
    lazerMeaningful: true,
  },

  {
    scope: "sounds",
    category: "hitsounds",
    label: "hitsounds",
    patterns: [
      "normal-hitnormal.*",
      "normal-hitwhistle.*",
      "normal-hitfinish.*",
      "normal-hitclap.*",
      "soft-hitnormal.*",
      "soft-hitwhistle.*",
      "soft-hitfinish.*",
      "soft-hitclap.*",
      "drum-hitnormal.*",
      "drum-hitwhistle.*",
      "drum-hitfinish.*",
      "drum-hitclap.*",
    ],
    lazerMeaningful: true,
  },
  {
    scope: "sounds",
    category: "slider",
    label: "slider sounds",
    patterns: [
      "normal-slidertick.*",
      "normal-sliderslide.*",
      "normal-sliderwhistle.*",
      "soft-slidertick.*",
      "soft-sliderslide.*",
      "soft-sliderwhistle.*",
      "drum-slidertick.*",
      "drum-sliderslide.*",
      "drum-sliderwhistle.*",
    ],
    lazerMeaningful: true,
  },
  {
    scope: "sounds",
    category: "gameplay",
    label: "gameplay sounds",
    patterns: [
      "spinnerspin.*",
      "spinnerbonus.*",
      "spinnerbonus-max.*",
      "combobreak.*",
      "failsound.*",
      "sectionpass.*",
      "sectionfail.*",
    ],
    lazerMeaningful: true,
  },
  {
    scope: "sounds",
    category: "countdown",
    label: "countdown sounds",
    patterns: [
      "count.*",
      "count1s.*",
      "count2s.*",
      "count3s.*",
      "gos.*",
      "readys.*",
    ],
    lazerMeaningful: true,
  },
  {
    scope: "sounds",
    category: "lazer",
    label: "lazer sounds",
    patterns: [
      "fountain-loop.*",
      "fountain-shoot.*",
      "taiko-strong-hitnormal.*",
      "taiko-strong-hitclap.*",
      "taiko-strong-hitflourish.*",
      "rank-up.*",
      "rank-down.*",
      "applause-s.*",
      "applause-a.*",
      "applause-b.*",
      "applause-c.*",
      "applause-d.*",
    ],
    lazerMeaningful: true,
  },
];

export function normalizeSeparators(value: string): string {
  return value.split(path.sep).join("/");
}

export function toPosixPath(value: string): string {
  return value.replaceAll("\\", "/");
}

export function stripScaleSuffix(fileName: string): string {
  const ext = path.extname(fileName);
  const stem = fileName.slice(0, fileName.length - ext.length);
  return `${stem.endsWith("@2x") ? stem.slice(0, -3) : stem}${ext}`;
}

function stripAnimationSuffix(fileName: string): string {
  const ext = path.extname(fileName);
  const stem = fileName.slice(0, fileName.length - ext.length);
  const numberedDash = stem.match(/^(.*)-\d+$/);
  if (numberedDash) return `${numberedDash[1]}${ext}`;
  const sliderBallFrame = stem.match(/^(sliderb)\d+$/);
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

export type SkinClassificationContext = {
  meaningfulKeys: Set<string>;
  fontPrefixes: Set<string>;
  referencedClassifications: Map<
    string,
    Pick<
      SkinClassification,
      "scope" | "category" | "componentId" | "requiredLevel"
    >
  >;
};

export function emptySkinContext(): SkinClassificationContext {
  return {
    meaningfulKeys: new Set(),
    fontPrefixes: new Set(),
    referencedClassifications: new Map(),
  };
}

function addReferencedAsset(
  context: SkinClassificationContext,
  rawValue: string,
  classification?: Pick<
    SkinClassification,
    "scope" | "category" | "componentId" | "requiredLevel"
  >,
): void {
  const trimmed = rawValue.trim().replace(/^["']|["']$/g, "");
  if (!trimmed || /^-?\d+(?:\.\d+)?$/.test(trimmed)) return;
  if (/^(true|false)$/i.test(trimmed)) return;
  if (/^\d+\s*,/.test(trimmed)) return;

  const value = toPosixPath(trimmed).split(/[;,]/)[0]?.trim();
  if (!value || /\s/.test(value)) return;

  const ext = path.extname(value).toLowerCase();
  const candidates = ext
    ? [value]
    : [
        `${value}.png`,
        `${value}.jpg`,
        `${value}.jpeg`,
        `${value}.wav`,
        `${value}.ogg`,
        `${value}.mp3`,
      ];
  for (const candidate of candidates) {
    const key = logicalSkinKey(candidate);
    context.meaningfulKeys.add(key);
    context.meaningfulKeys.add(key.split("/").at(-1) ?? key);
    if (classification) {
      context.referencedClassifications.set(key, classification);
      context.referencedClassifications.set(
        key.split("/").at(-1) ?? key,
        classification,
      );
    }
  }
}

const fontGlyphs = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "comma",
  "dot",
  "percent",
  "x",
  "pp",
];

function addFontPrefix(
  context: SkinClassificationContext,
  rawValue: string,
): void {
  const prefix = rawValue.trim().replace(/^["']|["']$/g, "");
  if (!prefix) return;
  context.fontPrefixes.add(prefix.toLowerCase());
  for (const glyph of fontGlyphs) {
    const key = `${prefix.toLowerCase()}-${glyph}.png`;
    context.meaningfulKeys.add(key);
    context.referencedClassifications.set(key, {
      scope: "fonts",
      category: "skin-ini-prefixes",
      componentId: "font-prefixes",
      requiredLevel: "recommended",
    });
  }
}

export function parseSkinIniContext(
  content: string,
): SkinClassificationContext {
  const context = emptySkinContext();
  let section = "";
  for (const line of content.split(/\r?\n/)) {
    const sectionMatch = line.match(/^\s*\[([^\]]+)]\s*$/);
    if (sectionMatch) {
      section = sectionMatch[1].trim().toLowerCase();
      continue;
    }
    const pair = line.match(/^\s*([^:#;][^:]*):\s*(.*?)\s*(?:[;#].*)?$/);
    if (!pair) continue;
    const key = pair[1].trim().toLowerCase();
    const value = pair[2].trim();
    if (key.endsWith("prefix")) addFontPrefix(context, value);
    if (
      section === "mania" ||
      /image|stage|note|key|light|hint|barline|warning/.test(key)
    ) {
      const category = key.includes("key")
        ? "keys"
        : key.includes("note")
          ? "notes"
          : key.includes("stage") ||
              key.includes("barline") ||
              key.includes("hint")
            ? "stage"
            : key.includes("light")
              ? "lighting"
              : "skin-ini-references";
      addReferencedAsset(
        context,
        value,
        section === "mania"
          ? {
              scope: "mania",
              category,
              componentId: "mania-custom-assets",
              requiredLevel: "recommended",
            }
          : {
              scope: "configs",
              category: "skin-ini-references",
              componentId: "skin-ini-references",
              requiredLevel: "recommended",
            },
      );
    }
  }
  return context;
}

export async function skinContextForRoot(
  root: string,
): Promise<SkinClassificationContext> {
  const skinIni = path.join(root, "skin.ini");
  const content = await readFile(skinIni, "utf8").catch(() => "");
  return content ? parseSkinIniContext(content) : emptySkinContext();
}

export function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replaceAll("*", ".*");
  return new RegExp(`^${escaped}$`);
}

function nameMatches(
  relativePath: string,
  patterns: string[],
  logical = false,
): boolean {
  const key = logical
    ? logicalSkinKey(relativePath)
    : canonicalKey(relativePath);
  const basename = key.split("/").at(-1) ?? key;
  return patterns.some((pattern) => {
    const lower = pattern.toLowerCase();
    return globToRegExp(lower).test(lower.includes("/") ? key : basename);
  });
}

export function matchesMode(relativePath: string, mode: Mode): boolean {
  return nameMatches(relativePath, modePatterns[mode]);
}

export function modesFor(relativePath: string): Mode[] {
  return modes.filter((mode) => matchesMode(relativePath, mode));
}

export function kindFor(relativePath: string): SkinKind {
  const ext = path.extname(relativePath).toLowerCase();
  if (imageExts.has(ext)) return "image";
  if (audioExts.has(ext)) return "audio";
  if (textExts.has(ext)) return "text";
  if (fontExts.has(ext)) return "font";
  return "other";
}

function titleize(value: string): string {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function sequenceInfo(relativePath: string): {
  groupKey: string;
  sequenceIndex: number | null;
} {
  const parsed = path.parse(toPosixPath(relativePath));
  let stem = stripScaleSuffix(parsed.name);
  const sequence = stem.match(/^(.*?)-(\d+)$/);
  if (sequence) {
    stem = sequence[1];
    return { groupKey: stem.toLowerCase(), sequenceIndex: Number(sequence[2]) };
  }
  const sliderBallFrame = stem.match(/^(sliderb)(\d+)$/);
  if (sliderBallFrame) {
    return {
      groupKey: sliderBallFrame[1].toLowerCase(),
      sequenceIndex: Number(sliderBallFrame[2]),
    };
  }
  return { groupKey: stem.toLowerCase(), sequenceIndex: null };
}

function fallbackGroup(relativePath: string): {
  groupKey: string;
  groupLabel: string;
  sequenceIndex: number | null;
} {
  const { groupKey, sequenceIndex } = sequenceInfo(relativePath);
  return { groupKey, groupLabel: titleize(groupKey), sequenceIndex };
}

export function classificationRuleId(
  rule: Rule,
  index = classificationRules.indexOf(rule),
): string {
  return rule.id ?? `${rule.scope}:${rule.category}:${index}`;
}

function componentIdFor(rule: Rule): string {
  return rule.componentId ?? `${rule.scope}:${rule.category}`;
}

function requiredLevelFor(rule: Rule): RequiredLevel {
  if (rule.requiredLevel) return rule.requiredLevel;
  return rule.lazerMeaningful ? "recommended" : "optional";
}

function isContextMeaningful(
  relativePath: string,
  context?: SkinClassificationContext,
): boolean {
  if (!context) return false;
  const keys = [canonicalKey(relativePath), logicalSkinKey(relativePath)];
  const basenames = keys.map((key) => key.split("/").at(-1) ?? key);
  if (
    keys.some((key) => context.meaningfulKeys.has(key)) ||
    basenames.some((basename) => context.meaningfulKeys.has(basename))
  )
    return true;
  const basename = basenames[0] ?? "";
  const ext = path.extname(basename);
  if (!ext) return false;
  const stem = basename.slice(0, basename.length - ext.length);
  return [...context.fontPrefixes].some((prefix) =>
    stem.startsWith(`${prefix}-`),
  );
}

function contextClassification(
  relativePath: string,
  context?: SkinClassificationContext,
): Pick<
  SkinClassification,
  | "ruleId"
  | "componentId"
  | "requiredLevel"
  | "scope"
  | "category"
  | "lazerMeaningful"
> | null {
  if (!isContextMeaningful(relativePath, context)) return null;
  const canonical = canonicalKey(relativePath);
  const logical = logicalSkinKey(relativePath);
  const basename = logical.split("/").at(-1) ?? "";
  const canonicalBase = canonical.split("/").at(-1) ?? canonical;
  const direct =
    context?.referencedClassifications.get(canonical) ??
    context?.referencedClassifications.get(logical) ??
    context?.referencedClassifications.get(canonicalBase) ??
    context?.referencedClassifications.get(basename);
  if (direct)
    return {
      ruleId: `skin-ini:${direct.scope}:${direct.category}`,
      componentId: direct.componentId,
      requiredLevel: direct.requiredLevel,
      ...direct,
      lazerMeaningful: true,
    };
  if (
    basename.startsWith("mania-") ||
    /^(note|key|stage|light|mania)/.test(basename)
  ) {
    if (basename.includes("key"))
      return {
        ruleId: "skin-ini:mania:keys",
        componentId: "mania-custom-assets",
        requiredLevel: "recommended",
        scope: "mania",
        category: "keys",
        lazerMeaningful: true,
      };
    if (basename.includes("note"))
      return {
        ruleId: "skin-ini:mania:notes",
        componentId: "mania-custom-assets",
        requiredLevel: "recommended",
        scope: "mania",
        category: "notes",
        lazerMeaningful: true,
      };
    if (basename.includes("stage"))
      return {
        ruleId: "skin-ini:mania:stage",
        componentId: "mania-custom-assets",
        requiredLevel: "recommended",
        scope: "mania",
        category: "stage",
        lazerMeaningful: true,
      };
    return {
      ruleId: "skin-ini:mania:references",
      componentId: "mania-custom-assets",
      requiredLevel: "recommended",
      scope: "mania",
      category: "skin-ini-references",
      lazerMeaningful: true,
    };
  }
  return {
    ruleId: "skin-ini:configs:references",
    componentId: "skin-ini-references",
    requiredLevel: "recommended",
    scope: "configs",
    category: "skin-ini-references",
    lazerMeaningful: true,
  };
}

export function classifySkinFile(
  relativePath: string,
  context?: SkinClassificationContext,
): SkinClassification {
  const key = canonicalKey(relativePath);
  const kind = kindFor(relativePath);
  const fileModes = modesFor(key);
  const group = fallbackGroup(key);
  const contextual = contextClassification(key, context);
  if (contextual) {
    return {
      ...contextual,
      groupKey: group.groupKey,
      groupLabel: group.groupLabel,
      sequenceIndex: group.sequenceIndex,
      modes: fileModes,
      kind,
    };
  }

  for (const rule of classificationRules) {
    if (!nameMatches(key, rule.patterns, true)) continue;
    const ruleIndex = classificationRules.indexOf(rule);
    return {
      ruleId: classificationRuleId(rule, ruleIndex),
      componentId: componentIdFor(rule),
      requiredLevel: requiredLevelFor(rule),
      scope: rule.scope,
      category: rule.category,
      groupKey: group.groupKey,
      groupLabel: group.groupLabel,
      sequenceIndex: group.sequenceIndex,
      modes: fileModes,
      kind,
      lazerMeaningful: rule.lazerMeaningful,
    };
  }

  return {
    ruleId: "extras:unclassified",
    componentId: "extras",
    requiredLevel: "optional",
    scope: "extras",
    category: kind === "other" ? "other-files" : `${kind}-files`,
    groupKey: group.groupKey,
    groupLabel: group.groupLabel,
    sequenceIndex: group.sequenceIndex,
    modes: fileModes,
    kind,
    lazerMeaningful: false,
  };
}

export function categoryFor(relativePath: string): string {
  return classifySkinFile(relativePath).scope;
}

export function structuredPathFor(
  relativePath: string,
  context?: SkinClassificationContext,
): string {
  const classification = classifySkinFile(relativePath, context);
  return `${classification.scope}/${classification.category}/${classification.groupKey}/${toPosixPath(relativePath)}`;
}

export function flatPathFromStructured(structuredPath: string): string {
  const parts = toPosixPath(structuredPath).split("/");
  if (scopes.includes(parts[0] as Scope) && parts.length >= 4) {
    return parts.slice(3).join("/");
  }
  if (scopes.includes(parts[0] as Scope)) {
    return parts.slice(1).join("/");
  }
  return toPosixPath(structuredPath);
}

export function safeJoin(root: string, relativePath: string): string {
  const normalized = toPosixPath(relativePath);
  if (path.isAbsolute(relativePath) || normalized.split("/").includes("..")) {
    throw new Error(`unsafe path: ${relativePath}`);
  }
  const target = path.resolve(root, normalized);
  const resolvedRoot = path.resolve(root);
  if (
    target !== resolvedRoot &&
    !target.startsWith(`${resolvedRoot}${path.sep}`)
  ) {
    throw new Error(`path escapes root: ${relativePath}`);
  }
  return target;
}

export async function walkFiles(root: string): Promise<SkinFile[]> {
  const files: SkinFile[] = [];
  const context = await skinContextForRoot(root);

  async function walk(current: string) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const relativePath = normalizeSeparators(path.relative(root, fullPath));
      files.push({
        root,
        relativePath,
        fullPath,
        ...classifySkinFile(relativePath, context),
      });
    }
  }

  await walk(root);
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export async function extractArchive(
  source: string,
  output: string,
): Promise<void> {
  await mkdir(output, { recursive: true });
  const listing = await $`unzip -Z1 ${source}`.quiet().text();
  for (const member of listing.split("\n").filter(Boolean)) {
    const normalized = toPosixPath(member);
    if (path.isAbsolute(member) || normalized.split("/").includes("..")) {
      throw new Error(`refusing unsafe archive member: ${member}`);
    }
  }
  await $`unzip -qq ${source} -d ${output}`.quiet();
}

export async function resolveSource(
  source: string,
  tempRoot: string,
): Promise<string> {
  const sourceStat = await stat(source).catch(() => null);
  if (!sourceStat) throw new Error(`source does not exist: ${source}`);
  if (sourceStat.isDirectory()) return source;
  if (sourceStat.isFile() && source.toLowerCase().endsWith(".osk")) {
    const output = path.join(
      tempRoot,
      path.basename(source, path.extname(source)),
    );
    await extractArchive(source, output);
    return output;
  }
  throw new Error(
    `source must be an extracted skin folder or .osk file: ${source}`,
  );
}

export async function copyTreeStructured(
  sourceRoot: string,
  outputRoot: string,
): Promise<Record<string, string>> {
  const manifest: Record<string, string> = {};
  const context = await skinContextForRoot(sourceRoot);
  for (const file of await walkFiles(sourceRoot)) {
    const structuredPath = structuredPathFor(file.relativePath, context);
    const target = safeJoin(outputRoot, structuredPath);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(file.fullPath, target);
    manifest[structuredPath] = file.relativePath;
  }
  return manifest;
}

export async function emptyDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
}
