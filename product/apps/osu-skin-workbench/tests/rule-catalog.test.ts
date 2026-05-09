import { describe, expect, test } from "bun:test";
import { classificationRules } from "../src/lib/classification/classification-rules";
import {
  classificationRuleGroups,
  rulesByGroup,
} from "../src/lib/classification/rule-catalog";

describe("classification rule catalog", () => {
  test("assigns every rule to an explicit ownership group", () => {
    const grouped = rulesByGroup();
    const groupedCount = classificationRuleGroups.reduce(
      (count, group) => count + grouped[group].length,
      0,
    );

    expect(groupedCount).toBe(classificationRules.length);
    expect(grouped.std.some((rule) => rule.id === "osu.hit-circles")).toBe(true);
    expect(grouped.sounds.some((rule) => rule.id === "sound.lazer")).toBe(true);
    expect(grouped.stable.every((rule) => rule.id.startsWith("stable."))).toBe(true);
  });
});
