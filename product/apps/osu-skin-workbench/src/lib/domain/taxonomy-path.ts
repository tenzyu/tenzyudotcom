import {
  taxonomyRegistry,
  type CategoryId,
  type GroupId,
  type ResolvedTaxonomyPath,
  type ScopeId,
  type TaxonomyCategory,
  type TaxonomyGroup,
  type TaxonomyPathInput,
  type TaxonomyRegistry,
  type TaxonomyScope,
} from "./taxonomy";

export type TaxonomyPathIds = {
  scopeId: ScopeId | string;
  categoryId: CategoryId;
  groupId: GroupId;
};

export type TaxonomyPathSnapshot = {
  key: string;
  label: string;
  structuredPrefix: string;
  scope: TaxonomyScope;
  category: TaxonomyCategory;
  group: TaxonomyGroup;
};

export class TaxonomyPath {
  readonly scope: TaxonomyScope;
  readonly category: TaxonomyCategory;
  readonly group: TaxonomyGroup;

  constructor(resolved: ResolvedTaxonomyPath) {
    this.scope = resolved.scope;
    this.category = resolved.category;
    this.group = resolved.group;
  }

  static from(input: TaxonomyPathInput, registry: TaxonomyRegistry = taxonomyRegistry): TaxonomyPath {
    return new TaxonomyPath(registry.resolvePath(input));
  }

  static fromIds(ids: TaxonomyPathIds, registry: TaxonomyRegistry = taxonomyRegistry): TaxonomyPath {
    return TaxonomyPath.from(ids, registry);
  }

  static fromSnapshot(snapshot: TaxonomyPathSnapshot): TaxonomyPath {
    return new TaxonomyPath({
      scope: snapshot.scope,
      category: snapshot.category,
      group: snapshot.group,
    });
  }

  get ids(): TaxonomyPathIds {
    return {
      scopeId: this.scope.id,
      categoryId: this.category.id,
      groupId: this.group.id,
    };
  }

  get key(): string {
    return `${this.scope.id}:${this.category.id}:${this.group.id}`;
  }

  get label(): string {
    return `${this.scope.label} > ${this.category.label} > ${this.group.label}`;
  }

  get structuredPrefix(): string {
    return `${this.scope.id}/${this.category.id}/${this.group.id}`;
  }

  isSameScope(other: TaxonomyPath): boolean {
    return this.scope.id === other.scope.id;
  }

  isSameCategory(other: TaxonomyPath): boolean {
    return this.isSameScope(other) && this.category.id === other.category.id;
  }

  isSameGroup(other: TaxonomyPath): boolean {
    return this.isSameCategory(other) && this.group.id === other.group.id;
  }

  equals(other: TaxonomyPath): boolean {
    return this.key === other.key;
  }

  toJSON(): TaxonomyPathSnapshot {
    return {
      key: this.key,
      label: this.label,
      structuredPrefix: this.structuredPrefix,
      scope: this.scope,
      category: this.category,
      group: this.group,
    };
  }
}

export function taxonomyPathFrom(input: TaxonomyPathInput): TaxonomyPath {
  return TaxonomyPath.from(input);
}

export function compareTaxonomyPath(a: TaxonomyPath, b: TaxonomyPath): number {
  return (
    a.scope.order - b.scope.order ||
    a.category.order - b.category.order ||
    a.group.order - b.group.order ||
    a.label.localeCompare(b.label) ||
    a.key.localeCompare(b.key)
  );
}