import { isScopeId, type ScopeId } from "../domain/taxonomy";
import type { TaxonomyPath } from "../domain/taxonomy-path";
import type { ClassifiedSkinAsset } from "../domain/skin-asset";
import { toPosixPath } from "../classification/filename-normalizer";

export type StructuredPathParts = {
  scopeId: ScopeId | string;
  categoryId: string;
  groupId: string;
  flatPath: string;
};

export type DecodedStructuredPath = StructuredPathParts & {
  structuredPath: string;
  isStructured: boolean;
  isLegacyStructured: boolean;
};

export type StructuredPathEncodingInput =
  | ClassifiedSkinAsset
  | {
      taxonomyPath: TaxonomyPath;
      flatPath: string;
    };

function normalizeRelativePath(value: string): string {
  const normalized = toPosixPath(value).replace(/^\/+/, "");

  if (!normalized) {
    throw new Error("path is empty");
  }

  if (normalized.split("/").includes("..")) {
    throw new Error(`unsafe relative path: ${value}`);
  }

  return normalized;
}

export class StructuredPathCodec {
  /**
   * New canonical format:
   *
   *   scope/category/group/original/flat/path.png
   */
  static encode(input: StructuredPathEncodingInput): string {
    const taxonomyPath = input.taxonomyPath;
    const flatPath = "file" in input ? input.file.relativePath : input.flatPath;

    return [
      taxonomyPath.scope.id,
      taxonomyPath.category.id,
      taxonomyPath.group.id,
      normalizeRelativePath(flatPath),
    ].join("/");
  }

  static decode(structuredPath: string): DecodedStructuredPath {
    const normalized = normalizeRelativePath(structuredPath);
    const parts = normalized.split("/");

    if (parts.length < 4) {
      return {
        structuredPath: normalized,
        scopeId: "",
        categoryId: "",
        groupId: "",
        flatPath: normalized,
        isStructured: false,
        isLegacyStructured: false,
      };
    }

    const [scopeId, categoryId, groupId, ...flatParts] = parts;

    return {
      structuredPath: normalized,
      scopeId,
      categoryId,
      groupId,
      flatPath: flatParts.join("/"),
      isStructured: true,
      isLegacyStructured: false,
    };
  }

  /**
   * Backward-compatible decoder for old manifests.
   *
   * Old behavior:
   * - scope/category/group/flat/path -> flat/path
   * - scope/flat/path                -> flat/path
   * - flat/path                      -> flat/path
   */
  static decodeLoose(structuredPath: string): DecodedStructuredPath {
    const normalized = normalizeRelativePath(structuredPath);
    const parts = normalized.split("/");

    if (!isScopeId(parts[0])) {
      return {
        structuredPath: normalized,
        scopeId: "",
        categoryId: "",
        groupId: "",
        flatPath: normalized,
        isStructured: false,
        isLegacyStructured: false,
      };
    }

    if (parts.length >= 4) {
      const [scopeId, categoryId, groupId, ...flatParts] = parts;

      return {
        structuredPath: normalized,
        scopeId,
        categoryId,
        groupId,
        flatPath: flatParts.join("/"),
        isStructured: true,
        isLegacyStructured: false,
      };
    }

    return {
      structuredPath: normalized,
      scopeId: parts[0],
      categoryId: "",
      groupId: "",
      flatPath: parts.slice(1).join("/"),
      isStructured: false,
      isLegacyStructured: true,
    };
  }

  static flatPathFromStructured(structuredPath: string): string {
    return StructuredPathCodec.decodeLoose(structuredPath).flatPath;
  }

  static isStructuredPath(value: string): boolean {
    return StructuredPathCodec.decodeLoose(value).isStructured;
  }
}

export function structuredPathForAsset(asset: ClassifiedSkinAsset): string {
  return StructuredPathCodec.encode(asset);
}

export function flatPathFromStructured(structuredPath: string): string {
  return StructuredPathCodec.flatPathFromStructured(structuredPath);
}
