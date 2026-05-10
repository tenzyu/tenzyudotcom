"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@tenzyu/ui/card";
import { Badge } from "@tenzyu/ui/badge";
import { Button } from "@tenzyu/ui/button";


import type { AssetMatrixRow } from "@tenzyu/osu-skin-core/lib/project/asset-matrix-builder";

type Props = {
  rows: AssetMatrixRow[];
  scope: string;
  category: string;
  warningCount: number;
};

export function EditorPreviewPanel({ rows, scope, category, warningCount }: Props) {
  const primaryCount = rows.filter((row) => row.lazerMeaningful).length;
  const missingCount = rows.filter((row) => row.cells.project.missing).length;
  const audioRow = rows.find((row) => row.kind === "audio");

  return (
    <Card variant="soft" className="editorPreviewPanel">
      <CardHeader>
        <CardTitle>Live skin model</CardTitle>
        <p className="mutedText">
          {scope} / {category}
        </p>
      </CardHeader>

      <CardContent>
        <div className="previewModeTabs">
          <Button type="button" size="xs">osu!</Button>
          <Button type="button" size="xs" variant="soft">taiko</Button>
          <Button type="button" size="xs" variant="soft">catch</Button>
          <Button type="button" size="xs" variant="soft">mania</Button>
        </div>

        <div className="gamePreviewSurface" aria-hidden>
          <div className="mockApproach" />
          <div className="mockHitObject">1</div>
          <div className="mockScore">1000000</div>
        </div>

        <div className="compatPanel">
          <CompatRow label="Primary rows" value={`${primaryCount}/${rows.length}`} tone="ok" />
          <CompatRow label="Missing project assets" value={String(missingCount)} tone={missingCount ? "warn" : "ok"} />
          <CompatRow label="Warnings" value={String(warningCount)} tone={warningCount ? "warn" : "ok"} />
          <CompatRow label="Audio sample" value={audioRow?.groupLabel ?? "none"} tone="info" />
        </div>

        <div className="audioRack">
          <strong>Hit sound rack</strong>
          <div className="waveformMock">
            <Button type="button" size="icon-xs" variant="soft" aria-label="Play sample">
              ▶
            </Button>
            <span />
            {audioRow && <Badge variant="secondary">{audioRow.kind}</Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompatRow({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" | "danger" | "info" }) {
  return (
    <div className={`compatRow ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
