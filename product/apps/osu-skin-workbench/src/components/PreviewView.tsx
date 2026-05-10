"use client";


import { useMemo } from "react";
import type { AssetMatrix } from "@tenzyu/osu-skin-core/lib/project/asset-matrix-builder";
import { AssetRow } from "./AssetRow";
import { Badge } from "@tenzyu/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@tenzyu/ui/card";

type Props = {
  matrix: AssetMatrix;
  scope: string;
  category: string;
};

export function PreviewView({ matrix, scope, category }: Props) {
  const rows = useMemo(
    () => matrix.rows.filter((row) => row.scope === scope && row.category === category),
    [matrix.rows, scope, category],
  );
  const primaryRows = rows.filter((row) => row.lazerMeaningful).length;
  const missingRows = rows.filter((row) => row.cells.project.missing).length;
  const warningRows = rows.filter((row) => row.warnings.length > 0 || Object.values(row.cells).some((cell) => cell.warnings.length > 0)).length;

  return (
    <section className="previewShell">
      <div className="previewTabs">
        <Badge variant="secondary">{rows.length} rows</Badge>
        <Badge variant="secondary">{primaryRows} meaningful</Badge>
        <Badge variant="secondary">{missingRows} missing</Badge>
        <Badge variant="secondary">{warningRows} warning rows</Badge>
      </div>

      <div className="previewStage">
        <Card variant="soft" className="lazerPreview">
          <CardHeader>
            <CardTitle>Gameplay preview</CardTitle>
            <p className="mutedText">Skin composition model for the active category.</p>
          </CardHeader>
          <CardContent className="previewMock">
            <div className="gameplayStage">
              <div className="songSelectStrip">
                <span>tenzyu-main</span>
                <span>{scope} / {category}</span>
              </div>
              <div className="playfieldMock">
                <span className="legacyDot" />
                <span className="primaryDot" />
                <span className="legacyDot" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="soft" className="previewAudioRack">
          <CardHeader>
            <CardTitle>Validation</CardTitle>
          </CardHeader>
          <CardContent className="previewStats">
            <PreviewStat label="Rows" value={rows.length} />
            <PreviewStat label="Meaningful" value={primaryRows} />
            <PreviewStat label="Missing" value={missingRows} />
            <PreviewStat label="Warnings" value={warningRows} />
          </CardContent>
        </Card>
      </div>

      <div className="previewRows">
        {rows.slice(0, 120).map((row) => (
          <AssetRow
            key={row.rowKey}
            projectId={null}
            row={row}
            cell={row.cells.project}
            side="project"
            sourceId={null}
          />
        ))}

        {!rows.length && (
          <div className="emptyState">
            No rows match the current scope and category.
          </div>
        )}
      </div>
    </section>
  );
}

function PreviewStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="previewStat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
