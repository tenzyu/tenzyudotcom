import { describe, expect, test } from "bun:test";
import { uiVariantPolicy } from "../src/tokens/variant-policy";

describe("uiVariantPolicy", () => {
  test("keeps destructive as a first-class variant", () => {
    expect(uiVariantPolicy.variants).toContain("destructive");
    expect(uiVariantPolicy.rules.destructiveIsVariant).toBe(true);
  });

  test("keeps app layout out of @tenzyu/ui", () => {
    expect(uiVariantPolicy.rules.applicationLayoutIsOutOfScope).toBe(true);
  });
});
