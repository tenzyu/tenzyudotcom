import { describe, expect, test } from "bun:test";
import { titleizeIdentifier } from "../src/lib/domain/label";
import {
  emptySkinMeaning,
  mergeSkinMeaning,
  preferSkinKind,
} from "../src/lib/domain/skin-asset-policy";

describe("domain display and asset policies", () => {
  test("titleizes identifiers through one shared label helper", () => {
    expect(titleizeIdentifier("std")).toBe("osu!standard");
    expect(titleizeIdentifier("score-pp")).toBe("Score PP");
    expect(titleizeIdentifier("main_hud_json")).toBe("Main HUD JSON");
  });

  test("merges skin meaning and prefers previewable kinds consistently", () => {
    expect(mergeSkinMeaning(emptySkinMeaning(), {
      lazerLegacy: true,
      lazerNative: false,
      stable: true,
    })).toEqual({
      lazerLegacy: true,
      lazerNative: false,
      stable: true,
    });

    expect(preferSkinKind("audio", "image")).toBe("image");
    expect(preferSkinKind("empty", "font")).toBe("font");
  });
});
