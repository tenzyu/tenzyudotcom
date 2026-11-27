import { describe, expect, test } from "bun:test";
import { classifySkinFile, matchingRuleFor } from "../src/lib/classification/skin-classifier";

describe("lazer meaningful classification", () => {
  test("keeps lazer result applause sounds out of stable-only archive", () => {
    for (const file of ["applause-s.wav", "applause-a.ogg", "applause-d.mp3"]) {
      const classified = classifySkinFile(file);

      expect(classified.ruleId).toBe("sound.lazer");
      expect(classified.scope).toBe("sounds");
      expect(classified.category).toBe("lazer");
      expect(classified.lazerMeaningful).toBe(true);
    }
  });

  test("classifies taiko shaker and playfield assets separately", () => {
    expect(classifySkinFile("spinner-warning.png").category).toBe("shaker");
    expect(classifySkinFile("spinner-circle.png").category).toBe("shaker");
    expect(classifySkinFile("taiko-slider.png").category).toBe("playfield-upper");
    expect(classifySkinFile("taiko-drum-inner.png").category).toBe("playfield-lower");
  });
});

test("retains frame indices while grouping canonical animation families", () => {
  for (const [filename, family, index] of [
    ["followpoint-2.png", "followpoint", 2],
    ["folder\\FOLLOWPOINT-12@2x.PNG", "followpoint", 12],
    ["sliderb0.png", "sliderb", 0],
    ["sliderb7@2x.png", "sliderb", 7],
    ["cursor.png", "cursor", null],
    ["custom-2-3.png", "custom-2", 3],
    ["followpoint-9007199254740992.png", "followpoint", null],
  ] as const) {
    const classified = classifySkinFile(filename);
    expect(classified.groupKey).toBe(family);
    expect(classified.sequenceIndex).toBe(index);
  }
});

import { classificationRules } from "../src/lib/classification/classification-rules";
import { canonicalKey, nameMatches } from "../src/lib/classification/filename-normalizer";

test("catalog matcher preserves first-match precedence for representative paths from every rule", () => {
  const paths = new Set(["unknown.bin", "folder\\FOLLOWPOINT-12@2x.PNG", "sliderb7@2x.png", "cursors/example.png"]);
  for (const rule of classificationRules) {
    for (const pattern of rule.patterns) {
      const sample = pattern.replaceAll("*", "example");
      paths.add(sample);
      paths.add("nested/" + sample.toUpperCase());
    }
  }
  for (const path of paths) {
    const expected = classificationRules.find(rule => nameMatches(canonicalKey(path), rule.patterns, { logical: true })) ?? null;
    expect(matchingRuleFor(path)).toBe(expected);
  }
});
