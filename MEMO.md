```
taxonomy
  -> rule references taxonomy path
    -> classifier returns TaxonomyPath
      -> AssetTreeBuilder builds UI tree
```

```
tools/domain/
  skin-asset.ts
  taxonomy.ts
  taxonomy-path.ts
  classification-rule.ts

tools/classification/
  skin-classifier.ts
  classification-rules.ts
  skin-ini-context.ts
  filename-normalizer.ts
  glob-matcher.ts

tools/project/
  structured-path-codec.ts
  skin-project-manifest.ts
  skin-project-repository.ts

tools/io/
  archive.ts
  walk-files.ts
  safe-path.ts

tools/application/
  import-skin.ts
  reclassify-project.ts
  build-file-tree.ts
  build-matrix.ts
```

```
TaxonomyPath
  UI 表示と分類階層

StructuredPathCodec
  保存用パス encode/decode

ClassificationRule
  ファイル名 pattern と TaxonomyPath の対応

ClassifiedSkinAsset
  1ファイルの分類結果

AssetTree
  UI 表示用の Scope > Category > Group

AssetMatrix
  project/source 比較用
```

```
tools/domain/taxonomy.ts
tools/domain/taxonomy-path.ts
tools/domain/skin-asset.ts

tools/classification/classification-rules.ts
tools/classification/skin-classifier.ts
tools/classification/skin-ini-context.ts
tools/classification/filename-normalizer.ts

tools/project/structured-path-codec.ts
tools/project/asset-tree-builder.ts
tools/project/asset-matrix-builder.ts
```