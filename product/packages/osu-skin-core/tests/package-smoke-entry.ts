import { classifySkinFiles } from "@tenzyu/osu-skin-core/classification";
import type { ProjectManifest } from "@tenzyu/osu-skin-core/contract";
import type { ClassifiedSkinAsset } from "@tenzyu/osu-skin-core/domain";
import { buildAssetMatrix } from "@tenzyu/osu-skin-core/project";

const assets = classifySkinFiles([
  {
    root: "",
    relativePath: "hitcircle.png",
    fullPath: "/tmp/hitcircle.png",
  },
]);

const matrix = buildAssetMatrix({
  project: assets,
  sources: [],
});

export const smoke: {
  assets: ClassifiedSkinAsset[];
  manifest?: ProjectManifest;
  matrix: unknown;
} = {
  assets,
  matrix,
};
