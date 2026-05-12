import { describe, expect, test } from "bun:test";
import { catalogedComponentFiles, storybookCategoryRules } from "../src/stories/_catalog";

describe("storybookCatalog", () => {
  test("registers primitive UI components", () => {
    expect(catalogedComponentFiles).toContain("button");
    expect(catalogedComponentFiles).toContain("card");
    expect(catalogedComponentFiles).toContain("input");
    expect(catalogedComponentFiles).toContain("dialog");
  });

  test("keeps product-specific layout out of Storybook categories", () => {
    expect(storybookCategoryRules.allowedTitlePrefix).toBe("Design System/");
    expect(storybookCategoryRules.contract).toContain("Product layouts belong to product apps");
  });
});
