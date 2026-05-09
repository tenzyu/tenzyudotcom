import { describe, expect, test } from "bun:test";
import { classifySkinFile } from "../src/lib/classification/skin-classifier";

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
