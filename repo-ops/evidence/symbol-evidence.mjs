import path from 'node:path'

// References are compiler observations, not a deletion or reachability verdict.
export function collectSymbolEvidence(ts, root, files) {
  const tracked = new Set(files)
  const relative = name => path.relative(root, name).split(path.sep).join('/')
  const local = name => /^(product|repo-ops)\//.test(name) && !name.split('/').includes('node_modules')
  const location = node => {
    const sf = node.getSourceFile()
    const file = relative(sf.fileName)
    const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
    return { file, line: line + 1, column: character + 1, tracked: tracked.has(file) }
  }
  const configPaths = files.filter(file => /^product\/(?:apps|packages)\/[^/]+\/tsconfig(?:\.[^.]+)?\.json$/.test(file))
  const covered = new Set()
  const projects = []
  for (const config of configPaths) {
    const errors = []
    const parsed = ts.getParsedCommandLineOfConfigFile(path.join(root, config), {}, {
      ...ts.sys, onUnRecoverableConfigFileDiagnostic: diagnostic => errors.push(diagnostic),
    })
    const diagnostics = diagnostic => ({
      code: diagnostic.code,
      ...(diagnostic.file && diagnostic.start !== undefined ? {
        file: relative(diagnostic.file.fileName),
        line: diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1,
      } : {}),
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    })
    if (!parsed) {
      projects.push({ config, status: 'config-error', diagnostics: errors.map(diagnostics) })
      continue
    }
    if (!parsed.fileNames.length) {
      projects.push({ config, status: 'no-root-files', diagnostics: parsed.errors.map(diagnostics) })
      continue
    }
    const program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options, projectReferences: parsed.projectReferences })
    const checker = program.getTypeChecker()
    const exports = [], references = [], visited = [], generatedDeclarations = []
    function targets(symbol) {
      if (!symbol) return []
      if (symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol)
      return (symbol.declarations ?? []).map(location).filter(target => local(target.file))
    }
    for (const sf of program.getSourceFiles()) {
      const file = relative(sf.fileName)
      if (!local(file) || (!tracked.has(file) && !sf.isDeclarationFile)) continue
      if (!tracked.has(file)) generatedDeclarations.push(file)
      else {
        covered.add(file)
        visited.push(file)
      }
      const module = checker.getSymbolAtLocation(sf)
      if (module) for (const exported of checker.getExportsOfModule(module)) {
        exports.push({ file, name: exported.getName(), targets: targets(exported) })
      }
      if (!tracked.has(file)) continue
      function visit(node) {
        // Import/export declarations expose or bind names; they do not prove use.
        if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isImportEqualsDeclaration(node)) return
        if (ts.isIdentifier(node) || ts.isStringLiteralLike(node) && ts.isElementAccessExpression(node.parent)) {
          const symbol = ts.isShorthandPropertyAssignment(node.parent) && node.parent.name === node
            ? checker.getShorthandAssignmentValueSymbol(node.parent)
            : checker.getSymbolAtLocation(node)
          if (symbol && !symbol.declarations?.some(declaration => declaration.name === node && !ts.isShorthandPropertyAssignment(declaration))) {
            const resolved = targets(symbol)
            if (resolved.length) references.push({ from: location(node), name: node.text, targets: resolved })
          }
        }
        ts.forEachChild(node, visit)
      }
      visit(sf)
    }
    const issues = [...errors, ...parsed.errors, ...program.getOptionsDiagnostics(), ...program.getSyntacticDiagnostics(), ...program.getSemanticDiagnostics()]
    projects.push({ config, status: issues.length ? 'diagnostics' : 'checked', files: visited, generatedDeclarations, exports, references, diagnostics: issues.map(diagnostics) })
  }
  const uncovered = files.filter(file => local(file) && /\.(?:[cm]?[jt]s|[jt]sx)$/.test(file) && !covered.has(file))
  return {
    compilerVersion: ts.version, projects, covered: [...covered].sort(), uncovered,
    limitations: [
      'Absence of references does not prove deadness; static use does not prove runtime reachability. Import/export bindings are excluded from use references.',
      'Each project uses its own compiler configuration. Overlapping projects can report the same observation.',
      'Generated declaration targets are reported with tracked=false; no inferred source mapping is asserted.',
      'Framework conventions, MDX, runtime registration, reflective access and unconfigured source require separate evidence.',
    ],
  }
}
