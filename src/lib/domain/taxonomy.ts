/**
 * TODO:
 * - 分類ルールは 1 ファイルに集約されていますが、scope/category/group/componentId/patterns/modes/kind/meaning/groupStrategy を毎回ベタ書きしているため、ここが最も大きい DRY 対象です。
 * このファイルが Single Source of Truth です。
 */

export const modeIds = ["osu", "taiko", "catch", "mania"] as const;
export type Mode = (typeof modeIds)[number];

export const scopeIds = [
  "interface",

  "std",
  "taiko",
  "catch",
  "mania",

  "fonts",
  "configs",
  "sounds",

  "stable",
  "extras",
] as const;

export type ScopeId = (typeof scopeIds)[number];

export type CategoryId = string;
export type GroupId = string;

export type TaxonomyScope = {
  id: string;
  label: string;
  description?: string;
  order: number;
};

export type TaxonomyCategory = {
  id: string;
  label: string;
  description?: string;
  order: number;
};

export type TaxonomyGroup = {
  id: string;
  label: string;
  description?: string;
  order: number;
};

export type TaxonomyGroupDefinition = {
  label: string;
  description?: string;
  order?: number;
};

export type TaxonomyCategoryDefinition = {
  label: string;
  description?: string;
  order?: number;
  groups?: Record<GroupId, TaxonomyGroupDefinition>;
};

export type TaxonomyScopeDefinition = {
  label: string;
  description?: string;
  order?: number;
  categories: Record<CategoryId, TaxonomyCategoryDefinition>;
};

export type TaxonomyDefinition = {
  scopes: Record<ScopeId, TaxonomyScopeDefinition>;
};

export type TaxonomyPathIds = {
  scopeId: ScopeId | string;
  categoryId: CategoryId;
  groupId: GroupId;
};

export type TaxonomyPathLabels = {
  scopeLabel?: string;
  categoryLabel?: string;
  groupLabel?: string;
};

export type TaxonomyPathInput = TaxonomyPathIds & TaxonomyPathLabels;

export type ResolvedTaxonomyPath = {
  scope: TaxonomyScope;
  category: TaxonomyCategory;
  group: TaxonomyGroup;
};

function defineTaxonomy<T extends TaxonomyDefinition>(definition: T): T {
  return definition;
}

export const taxonomyDefinition = defineTaxonomy({
  scopes: {
    std: {
      label: "osu!standard",
      description: "osu!standard gameplay assets used by lazer legacy skinning.",
      order: 100,
      categories: {
        "hit-circles": {
          label: "Hit Circles",
          order: 100,
          groups: {
            "hit-circles": { label: "Hit Circles", order: 100 },
            "approach-circle": { label: "Approach Circle", order: 110 },
            "follow-point": { label: "Follow Point", order: 120 },
          },
        },
        slider: {
          label: "Slider",
          order: 200,
          groups: {
            slider: { label: "Slider", order: 100 },
            "slider-ball": { label: "Slider Ball", order: 110 },
            "slider-follow-circle": { label: "Slider Follow Circle", order: 120 },
            "slider-score-point": { label: "Slider Score Point", order: 130 },
            "slider-miss-indicators": { label: "Slider Miss Indicators", order: 140 },
            "reverse-arrow": { label: "Reverse Arrow", order: 150 },
          },
        },
        particles: {
          label: "Particles",
          order: 300,
          groups: {
            lighting: { label: "Lighting", order: 100 },
          },
        },
        spinner: {
          label: "Spinner",
          order: 400,
          groups: {
            spinner: { label: "Spinner", order: 100 },
            "spinner-rpm": { label: "Spinner RPM", order: 110 },
            "spinner-text": { label: "Spinner Text", order: 120 },
          },
        },
        intro: {
          label: "Intro",
          order: 500,
          groups: {
            "skip-button": { label: "Skip Button", order: 100 },
          },
        },
        cursor: {
          label: "Cursor",
          order: 600,
          groups: {
            cursor: { label: "Cursor", order: 100 },
          },
        },
      },
    },

    taiko: {
      label: "osu!taiko",
      description: "osu!taiko gameplay assets used by lazer legacy skinning.",
      order: 200,
      categories: {
        "hit-bursts": {
          label: "Hit Bursts",
          order: 100,
          groups: {
            "hit-bursts": { label: "Hit Bursts", order: 100 },
          },
        },
        notes: {
          label: "Notes",
          order: 200,
          groups: {
            notes: { label: "Notes", order: 100 },
            "hit-circles": { label: "Hit Circles", order: 110 },
          },
        },
        "playfield-upper": {
          label: "Playfield Upper",
          order: 300,
          groups: {
            scroller: { label: "Scroller", order: 100 },
            glow: { label: "Kiai Glow", order: 110 },
          },
        },
        "playfield-lower": {
          label: "Playfield Lower",
          order: 400,
          groups: {
            drum: { label: "Drum", order: 100 },
            playfield: { label: "Playfield", order: 110 },
            barline: { label: "Barline", order: 120 },
          },
        },
        drumrolls: {
          label: "Drumrolls",
          order: 500,
          groups: {
            drumrolls: { label: "Drumrolls", order: 100 },
          },
        },
        shaker: {
          label: "Shaker",
          order: 600,
          groups: {
            shaker: { label: "Shaker", order: 100 },
          },
        },
      },
    },

    catch: {
      label: "osu!catch",
      description: "osu!catch gameplay assets used by lazer legacy skinning.",
      order: 300,
      categories: {
        catcher: {
          label: "Catcher",
          order: 100,
          groups: {
            catcher: { label: "Catcher", order: 100 },
            "old-catcher": { label: "Old Catcher", order: 110 },
          },
        },
        fruits: {
          label: "Fruits",
          order: 200,
          groups: {
            fruits: { label: "Fruits", order: 100 },
            bananas: { label: "Bananas", order: 110 },
            drops: { label: "Drops", order: 120 },
          },
        },
        particles: {
          label: "Particles",
          order: 300,
          groups: {
            lighting: { label: "Lighting", order: 100 },
          },
        },
      },
    },

    mania: {
      label: "osu!mania",
      description: "osu!mania gameplay assets and skin.ini-referenced mania assets.",
      order: 400,
      categories: {
        "hit-bursts": {
          label: "Hit Bursts",
          order: 100,
          groups: {
            "hit-bursts": { label: "Hit Bursts", order: 100 },
          },
        },
        comboburst: {
          label: "Combo Burst",
          order: 200,
          groups: {
            comboburst: { label: "Combo Burst", order: 100 },
          },
        },
        keys: {
          label: "Keys",
          order: 300,
          groups: {
            keys: { label: "Keys", order: 100 },
          },
        },
        notes: {
          label: "Notes",
          order: 400,
          groups: {
            notes: { label: "Notes", order: 100 },
            "hold-notes": { label: "Hold Notes", order: 110 },
          },
        },
        stage: {
          label: "Stage",
          order: 500,
          groups: {
            stage: { label: "Stage", order: 100 },
            "judgement-line": { label: "Judgement Line", order: 110 },
            "stage-hint": { label: "Stage Hint", order: 120 },
          },
        },
        lighting: {
          label: "Lighting",
          order: 600,
          groups: {
            lighting: { label: "Lighting", order: 100 },
          },
        },
        "skin-ini-references": {
          label: "skin.ini References",
          order: 900,
          groups: {
            "custom-assets": { label: "Custom Assets", order: 100 },
          },
        },
      },
    },

    interface: {
      label: "Interface",
      description: "Global legacy interface and HUD-adjacent assets meaningful in lazer.",
      order: 500,
      categories: {
        global: {
          label: "Global",
          order: 100,
          groups: {
            global: { label: "Global", order: 100 },
            "welcome-text": { label: "Welcome Text", order: 110 },
            "fountain-star": { label: "Fountain Star", order: 120 },
          },
        },
        cursor: {
          label: "Cursor",
          order: 200,
          groups: {
            cursor: { label: "Cursor", order: 100 },
          },
        },
        "input-overlay": {
          label: "Input Overlay",
          order: 300,
          groups: {
            "input-overlay": { label: "Input Overlay", order: 100 },
          },
        },
        "health-display": {
          label: "Health Display",
          order: 400,
          groups: {
            "health-display": { label: "Health Display", order: 100 },
            "scorebar": { label: "Scorebar", order: 110 },
          },
        },
        judgements: {
          label: "Judgements",
          order: 500,
          groups: {
            judgements: { label: "Judgements", order: 100 },
          },
        },
        particles: {
          label: "Particles",
          order: 600,
          groups: {
            particles: { label: "Particles", order: 100 },
          },
        },
      },
    },

    fonts: {
      label: "Typography",
      description: "Legacy sprite fonts and raw font files.",
      order: 600,
      categories: {
        score: {
          label: "Score Font",
          order: 100,
          groups: {
            score: { label: "Score Font", order: 100 },
          },
        },
        combo: {
          label: "Combo Font",
          order: 200,
          groups: {
            combo: { label: "Combo Font", order: 100 },
          },
        },
        "default-numbers": {
          label: "Default Numbers",
          order: 300,
          groups: {
            "default-numbers": { label: "Default Numbers", order: 100 },
          },
        },
        "score-entry": {
          label: "Score Entry Font",
          order: 400,
          groups: {
            "score-entry": { label: "Score Entry Font", order: 100 },
          },
        },
        "skin-ini-prefixes": {
          label: "skin.ini Font Prefixes",
          order: 500,
          groups: {
            "font-prefixes": { label: "Font Prefixes", order: 100 },
          },
        },
        "font-files": {
          label: "Font Files",
          order: 900,
          groups: {
            "font-files": { label: "Font Files", order: 100 },
          },
        },
      },
    },

    configs: {
      label: "Configuration",
      description: "skin.ini, lazer layout JSON, and configuration-referenced assets.",
      order: 700,
      categories: {
        "skin-ini": {
          label: "skin.ini",
          order: 100,
          groups: {
            "skin-ini": { label: "skin.ini", order: 100 },
          },
        },
        "lazer-layouts": {
          label: "lazer Layouts",
          order: 200,
          groups: {
            "lazer-layouts": { label: "lazer Layouts", order: 100 },
          },
        },
        "skin-ini-references": {
          label: "skin.ini References",
          order: 300,
          groups: {
            "skin-ini-references": { label: "skin.ini References", order: 100 },
          },
        },
      },
    },

    sounds: {
      label: "Audio",
      description: "Gameplay, hitsound, countdown, and lazer-specific audio.",
      order: 800,
      categories: {
        hitsounds: {
          label: "Hitsounds",
          order: 100,
          groups: {
            hitsounds: { label: "Hitsounds", order: 100 },
          },
        },
        slider: {
          label: "Slider Sounds",
          order: 200,
          groups: {
            slider: { label: "Slider Sounds", order: 100 },
          },
        },
        gameplay: {
          label: "Gameplay Sounds",
          order: 300,
          groups: {
            gameplay: { label: "Gameplay Sounds", order: 100 },
          },
        },
        countdown: {
          label: "Countdown Sounds",
          order: 400,
          groups: {
            countdown: { label: "Countdown Sounds", order: 100 },
          },
        },
        lazer: {
          label: "lazer Sounds",
          order: 500,
          groups: {
            lazer: { label: "lazer Sounds", order: 100 },
            "rank-change": { label: "Rank Change", order: 110 },
            applause: { label: "Applause", order: 120 },
            fountain: { label: "Fountain", order: 130 },
          },
        },
      },
    },

    stable: {
      label: "Stable Archive",
      description: "Stable-only or stable-first assets preserved for later support.",
      order: 900,
      categories: {
        ranking: {
          label: "Ranking Screen",
          order: 100,
          groups: {
            ranking: { label: "Ranking Screen", order: 100 },
            grades: { label: "Ranking Grades", order: 110 },
          },
        },
        "classic-menu": {
          label: "Classic Menu",
          order: 200,
          groups: {
            "classic-menu": { label: "Classic Menu", order: 100 },
          },
        },
        songselect: {
          label: "Song Select",
          order: 300,
          groups: {
            songselect: { label: "Song Select", order: 100 },
          },
        },
        "mode-icons": {
          label: "Mode Icons",
          order: 400,
          groups: {
            "mode-icons": { label: "Mode Icons", order: 100 },
          },
        },
        "mod-icons": {
          label: "Mod Icons",
          order: 500,
          groups: {
            "mod-icons": { label: "Mod Icons", order: 100 },
          },
        },
        selection: {
          label: "Selection",
          order: 600,
          groups: {
            selection: { label: "Selection", order: 100 },
          },
        },
        "pause-fail": {
          label: "Pause / Fail",
          order: 700,
          groups: {
            "pause-fail": { label: "Pause / Fail", order: 100 },
          },
        },
        "break-editor": {
          label: "Break / Editor",
          order: 800,
          groups: {
            "break-editor": { label: "Break / Editor", order: 100 },
          },
        },
        "countdown-images": {
          label: "Countdown Images",
          order: 900,
          groups: {
            "countdown-images": { label: "Countdown Images", order: 100 },
          },
        },
        decorative: {
          label: "Decorative",
          order: 1000,
          groups: {
            decorative: { label: "Decorative", order: 100 },
          },
        },
        "classic-ui-sounds": {
          label: "Classic UI Sounds",
          order: 1100,
          groups: {
            "classic-ui-sounds": { label: "Classic UI Sounds", order: 100 },
          },
        },
      },
    },

    extras: {
      label: "Extras",
      description: "Unclassified or preserved files.",
      order: 999,
      categories: {
        "image-files": {
          label: "Image Files",
          order: 100,
          groups: {
            "image-files": { label: "Image Files", order: 100 },
          },
        },
        "audio-files": {
          label: "Audio Files",
          order: 200,
          groups: {
            "audio-files": { label: "Audio Files", order: 100 },
          },
        },
        "text-files": {
          label: "Text Files",
          order: 300,
          groups: {
            "text-files": { label: "Text Files", order: 100 },
          },
        },
        "font-files": {
          label: "Font Files",
          order: 400,
          groups: {
            "font-files": { label: "Font Files", order: 100 },
          },
        },
        "other-files": {
          label: "Other Files",
          order: 900,
          groups: {
            "other-files": { label: "Other Files", order: 100 },
          },
        },
      },
    },
  },
} as const);

const labelOverrides: Record<string, string> = {
  std: "osu!standard",
  osu: "osu!",
  taiko: "osu!taiko",
  catch: "osu!catch",
  mania: "osu!mania",
  ui: "UI",
  hud: "HUD",
  json: "JSON",
  ini: "INI",
  pp: "PP",
  rpm: "RPM",
  sd: "SD",
  hd: "HD",
  kiai: "Kiai",
};

export function isScopeId(value: string): value is ScopeId {
  return (scopeIds as readonly string[]).includes(value);
}

export function humanizeIdentifier(value: string): string {
  const normalized = value
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[_/]+/g, "-")
    .toLowerCase();

  if (labelOverrides[normalized]) return labelOverrides[normalized];

  return normalized
    .split("-")
    .filter(Boolean)
    .map((part) => labelOverrides[part] ?? part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export class TaxonomyRegistry {
  constructor(readonly definition: TaxonomyDefinition = taxonomyDefinition) {}

  resolveScope(scopeId: ScopeId | string, fallback?: Pick<TaxonomyScope, "label" | "description" | "order">): TaxonomyScope {
    const known = isScopeId(scopeId) ? this.definition.scopes[scopeId] : undefined;

    return {
      id: scopeId,
      label: fallback?.label ?? known?.label ?? humanizeIdentifier(scopeId),
      description: fallback?.description ?? known?.description,
      order: fallback?.order ?? known?.order ?? 999,
    };
  }

  resolveCategory(
    scopeId: ScopeId | string,
    categoryId: CategoryId,
    fallback?: Pick<TaxonomyCategory, "label" | "description" | "order">,
  ): TaxonomyCategory {
    const category = isScopeId(scopeId)
      ? this.definition.scopes[scopeId]?.categories[categoryId]
      : undefined;

    return {
      id: categoryId,
      label: fallback?.label ?? category?.label ?? humanizeIdentifier(categoryId),
      description: fallback?.description ?? category?.description,
      order: fallback?.order ?? category?.order ?? 999,
    };
  }

  resolveGroup(
    ids: Pick<TaxonomyPathIds, "scopeId" | "categoryId" | "groupId">,
    fallback?: Pick<TaxonomyGroup, "label" | "description" | "order">,
  ): TaxonomyGroup {
    const group = isScopeId(ids.scopeId)
      ? this.definition.scopes[ids.scopeId]?.categories[ids.categoryId]?.groups?.[ids.groupId]
      : undefined;

    return {
      id: ids.groupId,
      label: fallback?.label ?? group?.label ?? humanizeIdentifier(ids.groupId),
      description: fallback?.description ?? group?.description,
      order: fallback?.order ?? group?.order ?? 999,
    };
  }

  resolvePath(input: TaxonomyPathInput): ResolvedTaxonomyPath {
    return {
      scope: this.resolveScope(input.scopeId, input.scopeLabel ? { label: input.scopeLabel, order: 999 } : undefined),
      category: this.resolveCategory(
        input.scopeId,
        input.categoryId,
        input.categoryLabel ? { label: input.categoryLabel, order: 999 } : undefined,
      ),
      group: this.resolveGroup(
        input,
        input.groupLabel ? { label: input.groupLabel, order: 999 } : undefined,
      ),
    };
  }

  compareScope(a: TaxonomyScope, b: TaxonomyScope): number {
    return a.order - b.order || a.label.localeCompare(b.label) || a.id.localeCompare(b.id);
  }

  compareCategory(a: TaxonomyCategory, b: TaxonomyCategory): number {
    return a.order - b.order || a.label.localeCompare(b.label) || a.id.localeCompare(b.id);
  }

  compareGroup(a: TaxonomyGroup, b: TaxonomyGroup): number {
    return a.order - b.order || a.label.localeCompare(b.label) || a.id.localeCompare(b.id);
  }
}

export const taxonomyRegistry = new TaxonomyRegistry();
