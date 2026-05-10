"use client";

import { useEffect, useMemo, useState } from "react";
import type { AssetMatrix } from "@tenzyu/osu-skin-core/lib/project/asset-matrix-builder";

export function useAssetMatrixNavigation(matrix: AssetMatrix) {
  const [activeScope, setActiveScope] = useState("std");
  const [activeCategory, setActiveCategory] = useState("hit-circles");
  const [selectedSourceId, setSelectedSourceId] = useState("");

  const scopes = useMemo(() => {
    const byScope = new Map<string, { id: string; label: string; count: number }>();

    for (const row of matrix.rows) {
      const current = byScope.get(row.scope) ?? {
        id: row.scope,
        label: row.taxonomy.scope.label,
        count: 0,
      };

      current.count += 1;
      byScope.set(row.scope, current);
    }

    return [...byScope.values()];
  }, [matrix.rows]);

  const categories = useMemo(() => {
    const byCategory = new Map<string, { id: string; label: string; count: number }>();

    for (const row of matrix.rows) {
      if (row.scope !== activeScope) continue;

      const current = byCategory.get(row.category) ?? {
        id: row.category,
        label: row.taxonomy.category.label,
        count: 0,
      };

      current.count += 1;
      byCategory.set(row.category, current);
    }

    return [...byCategory.values()];
  }, [activeScope, matrix.rows]);

  useEffect(() => {
    const hasActiveScope = matrix.rows.some((row) => row.scope === activeScope);
    const nextScope = hasActiveScope ? activeScope : matrix.rows[0]?.scope;

    if (!nextScope) return;

    const hasActiveCategory = matrix.rows.some(
      (row) => row.scope === nextScope && row.category === activeCategory,
    );

    const nextCategory = hasActiveCategory
      ? activeCategory
      : matrix.rows.find((row) => row.scope === nextScope)?.category;

    if (nextScope !== activeScope) setActiveScope(nextScope);
    if (nextCategory && nextCategory !== activeCategory) setActiveCategory(nextCategory);
  }, [activeCategory, activeScope, matrix.rows]);

  useEffect(() => {
    const sourceColumns = matrix.columns.filter((column) => column.kind === "source");

    if (!sourceColumns.length) {
      if (selectedSourceId) setSelectedSourceId("");
      return;
    }

    if (!sourceColumns.some((column) => column.id === selectedSourceId)) {
      setSelectedSourceId(sourceColumns[0].id);
    }
  }, [matrix.columns, selectedSourceId]);

  function selectScope(scopeId: string) {
    setActiveScope(scopeId);

    const firstCategory = matrix.rows.find((row) => row.scope === scopeId)?.category;
    setActiveCategory(firstCategory ?? "");
  }

  return {
    activeScope,
    activeCategory,
    selectedSourceId,
    scopes,
    categories,
    selectScope,
    setActiveCategory,
    setSelectedSourceId,
  };
}
