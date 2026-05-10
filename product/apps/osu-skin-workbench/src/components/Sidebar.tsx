"use client";


import type { AssetMatrix } from "@tenzyu/osu-skin-core/lib/project/asset-matrix-builder";
import type { ProjectManifest } from "@tenzyu/osu-skin-core/lib/shared/project-contract";
import { Badge } from "@tenzyu/ui/badge";
import { Button } from "@tenzyu/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@tenzyu/ui/card";
import { Input } from "@tenzyu/ui/input";
import { Label } from "@tenzyu/ui/label";
import { NativeSelect } from "@tenzyu/ui/native-select";

type Props = {
  project: ProjectManifest | null;
  projects: ProjectManifest[];
  projectName: string;
  mainPath: string;
  assetName: string;
  assetPath: string;
  loading: boolean;
  status: string;
  error: string | null;
  matrix: AssetMatrix;
  activeScope: string;
  activeCategory: string;
  onProjectName: (value: string) => void;
  onMainPath: (value: string) => void;
  onChooseMainPath: () => void;
  onImportMain: () => void;
  onAssetName: (value: string) => void;
  onAssetPath: (value: string) => void;
  onChooseAssetPath: () => void;
  onImportAsset: () => void;
  onProjectSelect: (projectId: string) => void;
  onSourceRename: (sourceId: string, name: string) => void;
  onSourceDelete: (sourceId: string) => void;
  onScope: (scope: string) => void;
  onCategory: (category: string) => void;
  onClose: () => void;
};

export function Sidebar(props: Props) {
  const scopes = collectScopes(props.matrix);
  const categories = collectCategories(props.matrix, props.activeScope);

  return (
    <aside className="sidebar">
      <div className="brandHeader">
        <div className="brand">
          <h1>osu! Skin Editor</h1>
          <p className="truncate mutedText">
            {props.project?.mainSourcePath ?? "No project selected"}
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={props.onClose} aria-label="Close sidebar">
          ‹
        </Button>
      </div>

      <Card variant="soft" className="sidebarCard">
        <CardHeader>
          <CardTitle>Main Skin</CardTitle>
          <CardDescription>Create or replace the editable project source.</CardDescription>
        </CardHeader>
        <CardContent className="formStack">
          <div className="fieldStack">
            <Label htmlFor="sidebar-project-select">Project</Label>
            <NativeSelect
              id="sidebar-project-select"
              value={props.project?.id ?? ""}
              onChange={(event) => props.onProjectSelect(event.target.value)}
              disabled={props.loading || !props.projects.length}
            >
              <option value="" disabled>
                Select project
              </option>
              {props.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="fieldStack">
            <Label htmlFor="main-project-name">Project name</Label>
            <Input
              id="main-project-name"
              value={props.projectName}
              onChange={(event) => props.onProjectName(event.target.value)}
              placeholder="optional"
              disabled={props.loading}
            />
          </div>

          <div className="fieldStack">
            <Label htmlFor="main-project-path">Path</Label>
            <Input
              id="main-project-path"
              value={props.mainPath}
              onChange={(event) => props.onMainPath(event.target.value)}
              placeholder="skins/example.osk or /absolute/skin"
              disabled={props.loading}
            />
          </div>

          <div className="buttonRow verticalButtons">
            <Button type="button" variant="soft" onClick={props.onChooseMainPath} disabled={props.loading}>
              Choose .osk / folder
            </Button>
            <Button type="button" onClick={props.onImportMain} disabled={props.loading || !props.mainPath.trim()}>
              Import main skin
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card variant="soft" className="sidebarCard">
        <CardHeader>
          <CardTitle>Asset Source</CardTitle>
          <CardDescription>Additional skins used as selectable parts.</CardDescription>
        </CardHeader>
        <CardContent className="formStack">
          <div className="fieldStack">
            <Label htmlFor="asset-name">Source name</Label>
            <Input
              id="asset-name"
              value={props.assetName}
              onChange={(event) => props.onAssetName(event.target.value)}
              placeholder="optional"
              disabled={props.loading || !props.project}
            />
          </div>

          <div className="fieldStack">
            <Label htmlFor="asset-path">Path</Label>
            <Input
              id="asset-path"
              value={props.assetPath}
              onChange={(event) => props.onAssetPath(event.target.value)}
              placeholder="skins/source.osk or /absolute/source/folder"
              disabled={props.loading || !props.project}
            />
          </div>

          <div className="buttonRow verticalButtons">
            <Button type="button" variant="soft" onClick={props.onChooseAssetPath} disabled={props.loading || !props.project}>
              Choose source
            </Button>
            <Button type="button" onClick={props.onImportAsset} disabled={props.loading || !props.project || !props.assetPath.trim()}>
              Add asset source
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card variant="soft" className="sidebarCard">
        <CardHeader>
          <CardTitle>Navigation</CardTitle>
        </CardHeader>
        <CardContent className="formStack">
          <div className="fieldStack">
            <Label htmlFor="scope-select">Scope</Label>
            <NativeSelect
              id="scope-select"
              value={props.activeScope}
              onChange={(event) => props.onScope(event.target.value)}
            >
              {scopes.map((scope) => (
                <option key={scope.id} value={scope.id}>
                  {scope.label}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="sideNavList">
            {categories.map((category) => (
              <Button
                key={category.id}
                type="button"
                variant={category.id === props.activeCategory ? "default" : "soft"}
                size="sm"
                className="sideNavButton"
                onClick={() => props.onCategory(category.id)}
              >
                <span>{category.label}</span>
                <Badge variant="secondary">{category.count}</Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card variant="soft" className="sidebarCard">
        <CardHeader>
          <CardTitle>Asset Sources</CardTitle>
        </CardHeader>
        <CardContent className="sourceList">
          {props.project?.sources.map((source) => (
            <div className="sourceRow" key={source.id}>
              <div className="sourceInfo">
                <div className="sourceTitleLine">
                  <strong>{source.name}</strong>
                  {source.readonly && <Badge variant="secondary">main</Badge>}
                </div>
                <p className="sourcePathText mutedText">
                  {source.sourcePath}
                </p>
              </div>
              <div className="sourceActions">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={props.loading || source.readonly}
                  onClick={() => {
                    const nextName = window.prompt("Source name", source.name);
                    if (nextName && nextName !== source.name) props.onSourceRename(source.id, nextName);
                  }}
                >
                  Rename
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="xs"
                  disabled={props.loading || source.readonly}
                  title={source.readonly ? "Main source cannot be deleted" : undefined}
                  onClick={() => {
                    if (window.confirm(`Delete asset source "${source.name}"?`)) props.onSourceDelete(source.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}

          {!props.project?.sources.length && <div className="statusSurface statusQuiet">No asset sources.</div>}
        </CardContent>
      </Card>

      <div className={`sidebarStatus ${props.error ? "statusDanger" : "statusQuiet"}`}>
        {props.error ?? props.status}
      </div>
    </aside>
  );
}

function collectScopes(matrix: AssetMatrix): Array<{ id: string; label: string; count: number }> {
  const map = new Map<string, { id: string; label: string; count: number }>();
  for (const row of matrix.rows) {
    const current = map.get(row.scope) ?? {
      id: row.scope,
      label: row.taxonomy.scope.label,
      count: 0,
    };
    current.count += 1;
    map.set(row.scope, current);
  }
  return [...map.values()];
}

function collectCategories(matrix: AssetMatrix, scope: string): Array<{ id: string; label: string; count: number }> {
  const map = new Map<string, { id: string; label: string; count: number }>();
  for (const row of matrix.rows) {
    if (row.scope !== scope) continue;
    const current = map.get(row.category) ?? {
      id: row.category,
      label: row.taxonomy.category.label,
      count: 0,
    };
    current.count += 1;
    map.set(row.category, current);
  }
  return [...map.values()];
}
