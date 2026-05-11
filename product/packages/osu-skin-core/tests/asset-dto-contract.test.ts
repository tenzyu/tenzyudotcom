import { describe, expect, test } from "bun:test";
import {
  toDesktopSkinAssetDto,
  toWebSafeSkinAssetDto,
} from "../src/lib/shared/asset-dto";
import { TaxonomyPath } from "../src/lib/domain/taxonomy-path";
import type { ClassifiedSkinAsset } from "../src/lib/domain/skin-asset";

function assetFixture(): ClassifiedSkinAsset {
  return {
    componentId: "osu.cursor",
    ruleId: "cursor",
    groupKey: "cursor",
    sequenceIndex: null,
    file: {
      root: "/skins/source",
      relativePath: "cursor.png",
      fullPath: "/skins/source/cursor.png",
      name: "cursor.png",
      extension: ".png",
    },
    taxonomyPath: TaxonomyPath.fromIds({
      scopeId: "std",
      categoryId: "cursor",
      groupId: "cursor",
    }),
    taxonomy: {
      key: "std:cursor:cursor",
      label: "osu!standard > Cursor > Cursor",
      structuredPrefix: "std/cursor/cursor",
      scope: { id: "std", label: "osu!standard", order: 100 },
      category: { id: "cursor", label: "Cursor", order: 600 },
      group: { id: "cursor", label: "Cursor", order: 100 },
    },
    requiredLevel: "required",
    modes: ["osu"],
    kind: "image",
    meaning: {
      lazerLegacy: true,
      lazerNative: false,
      stable: true,
    },
    source: { kind: "rule", ruleId: "cursor" },
  };
}

describe("asset DTO contract", () => {
  test("web-safe DTOs strip filesystem paths", () => {
    const dto = toWebSafeSkinAssetDto(assetFixture());

    expect(dto.file.root).toBe("");
    expect(dto.file.fullPath).toBe("");
    expect(dto.file.relativePath).toBe("cursor.png");
  });

  test("desktop DTOs retain full paths for Tauri previews", () => {
    const dto = toDesktopSkinAssetDto(assetFixture());

    expect(dto.file.root).toBe("/skins/source");
    expect(dto.file.fullPath).toBe("/skins/source/cursor.png");
  });
});
