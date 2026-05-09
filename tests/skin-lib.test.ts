import { describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { classifySkinFile, copyTreeStructured, parseSkinIniContext } from "../tools/skin-lib";

describe("skin classification", () => {
  test("classifies lazer taiko playfield and shaker assets", () => {
    expect(classifySkinFile("taiko-slider.png")).toMatchObject({
      scope: "taiko",
      category: "playfield-upper",
      lazerMeaningful: true,
    });
    expect(classifySkinFile("taiko-bar-left.png")).toMatchObject({
      scope: "taiko",
      category: "playfield-lower",
      lazerMeaningful: true,
    });
    expect(classifySkinFile("spinner-warning.png")).toMatchObject({
      scope: "taiko",
      category: "shaker",
      lazerMeaningful: true,
    });
  });

  test("keeps stable-only assets out of lazer meaningful editing", () => {
    expect(classifySkinFile("ranking-A.png")).toMatchObject({
      scope: "stable",
      category: "ranking",
      lazerMeaningful: false,
    });
    expect(classifySkinFile("taiko-flower-group.png")).toMatchObject({
      scope: "stable",
      category: "decorative",
      lazerMeaningful: false,
    });
    expect(classifySkinFile("applause.wav")).toMatchObject({
      scope: "stable",
      category: "classic-ui-sounds",
      lazerMeaningful: false,
    });
  });

  test("marks skin.ini mania image references and font prefixes as meaningful", () => {
    const context = parseSkinIniContext(`
[Fonts]
ScorePrefix: my-score

[Mania]
NoteImage0: custom-note
KeyImage0: custom-key.png
StageLeft: custom-stage
`);
    expect(classifySkinFile("my-score-0.png", context)).toMatchObject({
      scope: "fonts",
      category: "skin-ini-prefixes",
      lazerMeaningful: true,
    });
    expect(classifySkinFile("custom-note.png", context)).toMatchObject({
      scope: "mania",
      category: "notes",
      lazerMeaningful: true,
    });
    expect(classifySkinFile("custom-key@2x.png", context)).toMatchObject({
      scope: "mania",
      category: "keys",
      lazerMeaningful: true,
    });
    expect(classifySkinFile("custom-stage.png", context)).toMatchObject({
      scope: "mania",
      category: "stage",
      lazerMeaningful: true,
    });
  });

  test("normalises scale suffixes and animation frames into logical groups", () => {
    expect(classifySkinFile("followpoint-3@2x.png")).toMatchObject({
      groupKey: "followpoint",
      sequenceIndex: 3,
      scope: "std",
    });
    expect(classifySkinFile("sliderb0.png")).toMatchObject({
      groupKey: "sliderb",
      sequenceIndex: 0,
      scope: "std",
    });
  });

  test("structures a generated fixture with skin.ini references", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "skin-fixture-"));
    const output = await mkdtemp(path.join(tmpdir(), "skin-structured-"));
    try {
      await writeFile(path.join(root, "skin.ini"), `
[Fonts]
ScorePrefix: my-score

[Mania]
NoteImage0: custom-note
KeyImage0: custom-key
`);
      for (const file of [
        "taiko-slider.png",
        "spinner-warning.png",
        "custom-note.png",
        "custom-key@2x.png",
        "my-score-0.png",
        "ranking-A.png",
      ]) {
        await mkdir(path.dirname(path.join(root, file)), { recursive: true });
        await writeFile(path.join(root, file), "fixture");
      }
      const manifest = await copyTreeStructured(root, output);
      expect(Object.keys(manifest).some((entry) => entry.startsWith("taiko/playfield-upper/taiko-slider/"))).toBe(true);
      expect(Object.keys(manifest).some((entry) => entry.startsWith("taiko/shaker/spinner-warning/"))).toBe(true);
      expect(Object.keys(manifest).some((entry) => entry.startsWith("mania/notes/custom-note/"))).toBe(true);
      expect(Object.keys(manifest).some((entry) => entry.startsWith("mania/keys/custom-key/"))).toBe(true);
      expect(Object.keys(manifest).some((entry) => entry.startsWith("fonts/skin-ini-prefixes/my-score/"))).toBe(true);
      expect(Object.keys(manifest).some((entry) => entry.startsWith("stable/ranking/ranking-a/"))).toBe(true);
      expect(await readFile(path.join(output, "configs/skin-ini/skin/skin.ini"), "utf8")).toContain("[Mania]");
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(output, { recursive: true, force: true });
    }
  });
});
