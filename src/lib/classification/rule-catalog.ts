import type { ClassificationRule } from "./classification-rules";
import { classificationRules } from "./classification-rules";

export const classificationRuleGroups = [
  "configs",
  "interface",
  "std",
  "taiko",
  "catch",
  "mania",
  "fonts",
  "sounds",
  "stable",
] as const;

export type ClassificationRuleGroup = (typeof classificationRuleGroups)[number];

export function groupForClassificationRule(rule: ClassificationRule): ClassificationRuleGroup {
  if (rule.id.startsWith("config.")) return "configs";
  if (rule.id.startsWith("interface.")) return "interface";
  if (rule.id.startsWith("osu.")) return "std";
  if (rule.id.startsWith("taiko.")) return "taiko";
  if (rule.id.startsWith("catch.")) return "catch";
  if (rule.id.startsWith("mania.")) return "mania";
  if (rule.id.startsWith("font.")) return "fonts";
  if (rule.id.startsWith("sound.")) return "sounds";
  if (rule.id.startsWith("stable.")) return "stable";

  return "stable";
}

export function rulesByGroup(): Record<ClassificationRuleGroup, ClassificationRule[]> {
  const grouped = {} as Record<ClassificationRuleGroup, ClassificationRule[]>;

  for (const group of classificationRuleGroups) {
    grouped[group] = [];
  }

  for (const rule of classificationRules) {
    grouped[groupForClassificationRule(rule)].push(rule);
  }

  return grouped;
}
