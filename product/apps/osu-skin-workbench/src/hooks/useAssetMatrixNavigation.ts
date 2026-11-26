"use client";

import { useEffect, useState } from "react";
import type { AssetMatrix } from "@tenzyu/osu-skin-core/project";

export function useAssetMatrixNavigation(matrix: AssetMatrix) {
  const [activeScope, setActiveScope] = useState("std");
  const [activeCategory, setActiveCategory] = useState("hit-circles");
  const [selectedSourceId, setSelectedSourceId] = useState("");

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
    selectScope,
    setActiveCategory,
    setSelectedSourceId,
  };
}
