import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

export type SiteRuleIssue =
  | {
      kind: 'middleware-file'
      filePath: string
      message: string
    }
  | {
      kind: 'server-action-auth'
      filePath: string
      symbolName: string
      message: string
    }
  | {
      kind: 'editor-collection-registry'
      filePath: string
      message: string
    }
  | {
      kind: 'descriptor-owner'
      filePath: string
      message: string
    }
  | {
      kind: 'storage-owner'
      filePath: string
      message: string
    }
  | {
      kind: 'zod-owner'
      filePath: string
      message: string
    }
  | {
      kind: 'next-server-api-owner'
      filePath: string
      message: string
    }

type AnalyzeOptions = {
  projectRoot?: string
}

const SERVER_ACTION_EXCEPTIONS = new Set([
  'loginEditorAdminAction',
  'logoutEditorAdminAction',
])

const DESCRIPTOR_GLOB_ROOT = 'src/features'
const SERVER_ACTION_ROOT = 'src/app/[locale]/(admin)/editor/_features'
const EDITOR_COLLECTION_DOMAIN_FILE = 'src/lib/editor/editor.domain.ts'
const EDITOR_COLLECTION_REGISTRY_FILE =
  'src/app/[locale]/(admin)/editor/_features/editor.collections.ts'
const DESCRIPTOR_OWNER_ROOT = 'src/features/editor-collections/'
const STORAGE_OWNER_ROOT = 'src/lib/editor/'
const NEXT_SERVER_APIS = new Set([
  'next/cache',
  'next/headers',
  'next/navigation',
])

function normalizePath(filePath: string) {
  return filePath.split(path.sep).join('/')
}

function readSourceFile(projectRoot: string, relativePath: string) {
  const absolutePath = path.join(projectRoot, relativePath)
  const sourceText = readFileSync(absolutePath, 'utf8')
  return ts.createSourceFile(
    absolutePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    relativePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
}

function collectFiles(rootDir: string, predicate: (relativePath: string) => boolean) {
  const results: string[] = []

  function visit(currentDir: string) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        visit(absolutePath)
        continue
      }

      const relativePath = normalizePath(path.relative(rootDir, absolutePath))
      if (predicate(relativePath)) {
        results.push(relativePath)
      }
    }
  }

  if (existsSync(rootDir)) {
    visit(rootDir)
  }

  return results.sort()
}

function isUseServerFile(sourceFile: ts.SourceFile) {
  const [firstStatement] = sourceFile.statements

  return (
    firstStatement !== undefined &&
    ts.isExpressionStatement(firstStatement) &&
    ts.isStringLiteral(firstStatement.expression) &&
    firstStatement.expression.text === 'use server'
  )
}

function collectProjectSourceFiles(projectRoot: string) {
  return collectFiles(
    path.join(projectRoot, 'src'),
    (relativePath) =>
      /\.(ts|tsx)$/.test(relativePath) &&
      !relativePath.endsWith('.test.ts') &&
      !relativePath.endsWith('.spec.ts'),
  ).map((relativePath) => normalizePath(path.join('src', relativePath)))
}

function sourceFileHasImport(sourceFile: ts.SourceFile, moduleName: string) {
  return sourceFile.statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === moduleName,
  )
}

function isEditorCollectionDescriptorReference(node: ts.TypeNode | undefined) {
  return (
    node !== undefined &&
    ts.isTypeReferenceNode(node) &&
    ts.isIdentifier(node.typeName) &&
    node.typeName.text === 'EditorCollectionDescriptor'
  )
}

function isGuardCallExpression(node: ts.Node) {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    (node.expression.text === 'hasEditorAdminSession' ||
      node.expression.text === 'requireEditorAdminSession')
  )
}

function functionBodyHasAdminGuard(body: ts.FunctionBody | ts.ConciseBody | undefined) {
  if (!body) {
    return false
  }

  let found = false

  function visit(node: ts.Node) {
    if (found) {
      return
    }

    if (isGuardCallExpression(node)) {
      found = true
      return
    }

    ts.forEachChild(node, visit)
  }

  visit(body)

  return found
}

function collectExportedFunctionIssues(projectRoot: string) {
  const root = path.join(projectRoot, SERVER_ACTION_ROOT)
  const relativePaths = collectFiles(
    root,
    (relativePath) => /\.(ts|tsx)$/.test(relativePath) && !relativePath.endsWith('.test.ts'),
  )

  const issues: SiteRuleIssue[] = []

  for (const relativePathFromRoot of relativePaths) {
    const filePath = normalizePath(
      path.join(SERVER_ACTION_ROOT, relativePathFromRoot),
    )
    const sourceFile = readSourceFile(projectRoot, filePath)

    if (!isUseServerFile(sourceFile)) {
      continue
    }

    for (const statement of sourceFile.statements) {
      if (
        ts.isFunctionDeclaration(statement) &&
        statement.name &&
        statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        if (SERVER_ACTION_EXCEPTIONS.has(statement.name.text)) {
          continue
        }

        if (!functionBodyHasAdminGuard(statement.body)) {
          issues.push({
            kind: 'server-action-auth',
            filePath,
            symbolName: statement.name.text,
            message:
              'admin server actions must call hasEditorAdminSession or requireEditorAdminSession',
          })
        }
      }

      if (
        ts.isVariableStatement(statement) &&
        statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        for (const declaration of statement.declarationList.declarations) {
          if (!ts.isIdentifier(declaration.name)) {
            continue
          }

          const symbolName = declaration.name.text
          if (SERVER_ACTION_EXCEPTIONS.has(symbolName)) {
            continue
          }

          const initializer = declaration.initializer
          const body =
            initializer && (
              ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)
            )
              ? initializer.body
              : undefined

          if (!functionBodyHasAdminGuard(body)) {
            issues.push({
              kind: 'server-action-auth',
              filePath,
              symbolName,
              message:
                'admin server actions must call hasEditorAdminSession or requireEditorAdminSession',
            })
          }
        }
      }
    }
  }

  return issues
}

function collectStringLiteralUnionMembers(sourceFile: ts.SourceFile, typeName: string) {
  const ids = new Set<string>()

  for (const statement of sourceFile.statements) {
    if (
      ts.isTypeAliasDeclaration(statement) &&
      statement.name.text === typeName &&
      ts.isUnionTypeNode(statement.type)
    ) {
      for (const member of statement.type.types) {
        if (ts.isLiteralTypeNode(member) && ts.isStringLiteral(member.literal)) {
          ids.add(member.literal.text)
        }
      }
    }
  }

  return ids
}

function collectRegistryKeys(sourceFile: ts.SourceFile, constName: string) {
  const keys = new Set<string>()

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue
    }

    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === constName &&
        declaration.initializer &&
        ts.isObjectLiteralExpression(declaration.initializer)
      ) {
        for (const property of declaration.initializer.properties) {
          if (
            ts.isPropertyAssignment(property) &&
            (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
          ) {
            keys.add(property.name.text)
          }
        }
      }
    }
  }

  return keys
}

function collectDescriptorIds(projectRoot: string) {
  const root = path.join(projectRoot, DESCRIPTOR_GLOB_ROOT)
  const relativePaths = collectFiles(
    root,
    (relativePath) =>
      relativePath.endsWith('.ts') &&
      !relativePath.endsWith('.test.ts') &&
      !relativePath.endsWith('.spec.ts'),
  )

  const descriptorIds = new Set<string>()
  const pattern = /EditorCollectionDescriptor<'([^']+)'>/g

  for (const relativePathFromRoot of relativePaths) {
    const filePath = path.join(DESCRIPTOR_GLOB_ROOT, relativePathFromRoot)
    const sourceText = readFileSync(path.join(projectRoot, filePath), 'utf8')

    for (const match of sourceText.matchAll(pattern)) {
      descriptorIds.add(match[1])
    }
  }

  return descriptorIds
}

function setDifference(left: Set<string>, right: Set<string>) {
  return [...left].filter((value) => !right.has(value)).sort()
}

function collectEditorCollectionRegistryIssues(projectRoot: string) {
  const issues: SiteRuleIssue[] = []
  const domainPath = path.join(projectRoot, EDITOR_COLLECTION_DOMAIN_FILE)
  const registryPath = path.join(projectRoot, EDITOR_COLLECTION_REGISTRY_FILE)

  if (!existsSync(domainPath) || !existsSync(registryPath)) {
    return issues
  }

  const domainSourceFile = readSourceFile(projectRoot, EDITOR_COLLECTION_DOMAIN_FILE)
  const registrySourceFile = readSourceFile(projectRoot, EDITOR_COLLECTION_REGISTRY_FILE)

  const declaredIds = collectStringLiteralUnionMembers(
    domainSourceFile,
    'EditorCollectionId',
  )
  const registeredIds = collectRegistryKeys(registrySourceFile, 'EDITOR_COLLECTIONS')
  const descriptorIds = collectDescriptorIds(projectRoot)

  const missingFromRegistry = setDifference(declaredIds, registeredIds)
  const missingFromDomain = setDifference(registeredIds, declaredIds)
  const orphanDescriptors = setDifference(descriptorIds, declaredIds)
  const unregisteredDescriptors = setDifference(descriptorIds, registeredIds)

  for (const collectionId of missingFromRegistry) {
    issues.push({
      kind: 'editor-collection-registry',
      filePath: EDITOR_COLLECTION_REGISTRY_FILE,
      message: `collection '${collectionId}' exists in EditorCollectionId but is missing from EDITOR_COLLECTIONS`,
    })
  }

  for (const collectionId of missingFromDomain) {
    issues.push({
      kind: 'editor-collection-registry',
      filePath: EDITOR_COLLECTION_DOMAIN_FILE,
      message: `collection '${collectionId}' exists in EDITOR_COLLECTIONS but is missing from EditorCollectionId`,
    })
  }

  for (const collectionId of orphanDescriptors) {
    issues.push({
      kind: 'editor-collection-registry',
      filePath: DESCRIPTOR_GLOB_ROOT,
      message: `collection '${collectionId}' has a descriptor but is missing from EditorCollectionId`,
    })
  }

  for (const collectionId of unregisteredDescriptors) {
    issues.push({
      kind: 'editor-collection-registry',
      filePath: EDITOR_COLLECTION_REGISTRY_FILE,
      message: `collection '${collectionId}' has a descriptor but is missing from EDITOR_COLLECTIONS`,
    })
  }

  return issues
}

function collectMiddlewareConventionIssues(projectRoot: string) {
  const issues: SiteRuleIssue[] = []
  const forbiddenFiles = ['middleware.ts', 'src/middleware.ts']

  for (const filePath of forbiddenFiles) {
    if (existsSync(path.join(projectRoot, filePath))) {
      issues.push({
        kind: 'middleware-file',
        filePath,
        message: 'Next.js 16 projects must use proxy.ts instead of middleware.ts',
      })
    }
  }

  return issues
}

function collectDescriptorOwnerIssues(projectRoot: string) {
  const issues: SiteRuleIssue[] = []

  for (const filePath of collectProjectSourceFiles(projectRoot)) {
    if (
      filePath === 'src/lib/editor/editor.port.ts' ||
      filePath.startsWith(DESCRIPTOR_OWNER_ROOT)
    ) {
      continue
    }

    const sourceFile = readSourceFile(projectRoot, filePath)
    const ownsDescriptor = sourceFile.statements.some(
      (statement) =>
        ts.isVariableStatement(statement) &&
        statement.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        ) &&
        statement.declarationList.declarations.some((declaration) =>
          isEditorCollectionDescriptorReference(declaration.type),
        ),
    )

    if (!ownsDescriptor) {
      continue
    }

    issues.push({
      kind: 'descriptor-owner',
      filePath,
      message:
        'EditorCollectionDescriptor owners must live under src/features/editor-collections/',
    })
  }

  return issues
}

function collectStorageOwnerIssues(projectRoot: string) {
  const issues: SiteRuleIssue[] = []

  for (const filePath of collectProjectSourceFiles(projectRoot)) {
    if (filePath.startsWith(STORAGE_OWNER_ROOT)) {
      continue
    }

    const sourceFile = readSourceFile(projectRoot, filePath)
    const sourceText = sourceFile.getFullText()

    if (
      sourceFileHasImport(sourceFile, 'node:fs') ||
      sourceFileHasImport(sourceFile, 'node:fs/promises') ||
      sourceText.includes("join(process.cwd(), 'storage'") ||
      sourceText.includes('join(process.cwd(), "storage"') ||
      sourceText.includes("process.cwd(), 'storage'") ||
      sourceText.includes('process.cwd(), "storage"') ||
      sourceText.includes("'storage/") ||
      sourceText.includes('"storage/')
    ) {
      issues.push({
        kind: 'storage-owner',
        filePath,
        message:
          'storage access must be owned by src/lib/editor/ infrastructure modules',
      })
    }
  }

  return issues
}

function collectZodOwnerIssues(projectRoot: string) {
  const issues: SiteRuleIssue[] = []

  for (const filePath of collectProjectSourceFiles(projectRoot)) {
    const allowed =
      filePath.endsWith('.assemble.ts') ||
      filePath.startsWith(DESCRIPTOR_OWNER_ROOT)

    if (allowed) {
      continue
    }

    const sourceFile = readSourceFile(projectRoot, filePath)
    if (!sourceFileHasImport(sourceFile, 'zod')) {
      continue
    }

    issues.push({
      kind: 'zod-owner',
      filePath,
      message:
        'zod usage must be owned by *.assemble.ts or src/features/editor-collections/',
    })
  }

  return issues
}

function collectNextServerApiOwnerIssues(projectRoot: string) {
  const issues: SiteRuleIssue[] = []

  for (const filePath of collectProjectSourceFiles(projectRoot)) {
    const allowed =
      filePath.startsWith('src/app/') || filePath.endsWith('.assemble.ts')

    if (allowed) {
      continue
    }

    const sourceFile = readSourceFile(projectRoot, filePath)
    const hasNextServerImport = [...NEXT_SERVER_APIS].some((moduleName) =>
      sourceFileHasImport(sourceFile, moduleName),
    )

    if (!hasNextServerImport) {
      continue
    }

    issues.push({
      kind: 'next-server-api-owner',
      filePath,
      message:
        'Next server APIs must be owned by src/app/ entrypoints or *.assemble.ts',
    })
  }

  return issues
}

export function analyzeSiteRules(options: AnalyzeOptions = {}) {
  const projectRoot = options.projectRoot ?? process.cwd()

  return [
    ...collectMiddlewareConventionIssues(projectRoot),
    ...collectExportedFunctionIssues(projectRoot),
    ...collectEditorCollectionRegistryIssues(projectRoot),
    ...collectDescriptorOwnerIssues(projectRoot),
    ...collectStorageOwnerIssues(projectRoot),
    ...collectZodOwnerIssues(projectRoot),
    ...collectNextServerApiOwnerIssues(projectRoot),
  ].sort((left, right) =>
    left.filePath === right.filePath
      ? left.message.localeCompare(right.message)
      : left.filePath.localeCompare(right.filePath),
  )
}

function formatIssue(issue: SiteRuleIssue) {
  if (issue.kind === 'server-action-auth') {
    return `${issue.filePath}#${issue.symbolName}: ${issue.message}. Read: /docs/design-docs/references/site-rules.md`
  }

  return `${issue.filePath}: ${issue.message}. Read: /docs/design-docs/references/site-rules.md`
}

function main() {
  const issues = analyzeSiteRules()

  if (issues.length === 0) {
    console.log('No site rule issues found.')
    return
  }

  for (const issue of issues) {
    console.error(formatIssue(issue))
  }

  process.exitCode = 1
}

if (import.meta.main) {
  main()
}
