// Disposable evidence collector, not a new architecture policy or production dependency.
// Run against a checked-out revision with its own frozen workspace install.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const root = path.resolve(process.argv[2] || '.')
const output = path.resolve(process.argv[3] || 'architecture-evidence.json')
const require = createRequire(path.join(root, 'package.json'))
const ts = require('typescript')
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const files = git('ls-files', '-z').split('\0').filter(Boolean)
const fileSet = new Set(files)
const read = f => fs.readFileSync(path.join(root, f), 'utf8')
const source = files.filter(f => /\.(?:[cm]?[jt]s|[jt]sx)$/.test(f) && !f.endsWith('.d.ts'))
const isTest = f => /(?:^|\/)(?:tests?|__tests__|stories|\.storybook)(?:\/|$)|\.(?:test|spec|stories)\./.test(f)
const scope = f => {
  const p = f.split('/')
  return p[0] === 'product' ? p.slice(0,3).join('/') : p[0] === 'repo-ops' ? 'repo-ops' : 'workspace'
}
const owner = f => {
  const p = f.split('/')
  if (p[0] !== 'product') return scope(f)
  if (p[2] === 'web' && p[3] === 'src') {
    return [...p.slice(0,4), ...p.slice(4, ['features','platform','composition','components','lib'].includes(p[4]) ? 6 : 5)].join('/')
  }
  return scope(f)
}
const packageRoots = files.filter(f => /^product\/(?:apps|packages)\/[^/]+\/package\.json$/.test(f))
const packages = Object.fromEntries(packageRoots.map(f => {
  const manifest = JSON.parse(read(f))
  return [manifest.name, { root: path.posix.dirname(f), manifest }]
}))
const opts = new Map()
for (const {root: p} of Object.values(packages)) {
  const config = path.join(root,p,'tsconfig.json')
  if (!fs.existsSync(config)) continue
  const loaded = ts.readConfigFile(config, ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(loaded.config || {}, ts.sys, path.dirname(config))
  opts.set(p, parsed.options)
}
const rel = f => path.relative(root,f).split(path.sep).join('/')
const normalize = f => path.posix.normalize(f)
function candidate(f) {
  const stem = f.replace(/\.(?:mjs|cjs|js|jsx|d\.ts)$/, '')
  for (const c of [f,stem,...['.ts','.tsx','.mts','.cts','.js','.jsx','.mjs','.cjs','.css','.json','.mdx'].map(e=>stem+e),...['.ts','.tsx','.js','.mts'].map(e=>stem+'/index'+e)]) {
    if (fileSet.has(c)) return c
  }
}
function resolve(from, spec) {
  const p = scope(from)
  if (spec.startsWith('.')) return candidate(normalize(path.posix.join(path.posix.dirname(from),spec)))
  if (spec.startsWith('@/')) return candidate(p+'/src/'+spec.slice(2))
  for (const [name, pkg] of Object.entries(packages)) {
    if (spec !== name && !spec.startsWith(name+'/')) continue
    const sub = spec === name ? '.' : './'+spec.slice(name.length+1)
    let entry = pkg.manifest.exports?.[sub]
    if (!entry && sub !== '.' && pkg.manifest.exports?.['./*']) {
      const pattern = pkg.manifest.exports['./*']
      const replace = value => typeof value === 'string' ? value.replace('*',sub.slice(2)) : Object.fromEntries(Object.entries(value).map(([key,val])=>[key,replace(val)]))
      entry = replace(pattern)
    }
    const target = typeof entry === 'string' ? entry : entry?.types ?? entry?.import ?? entry?.default
    if (target) {
      const source = target.replace(/^\.\/dist\/src\//,'src/').replace(/^\.\/dist\//,'src/').replace(/^\.\//,'').replace(/\.d\.ts$/,'')
      if (sub === './styles.css' && name === '@tenzyu/ui') return candidate(pkg.root+'/src/index.css')
      const resolved = candidate(pkg.root+'/'+source)
      if (resolved) return resolved
    }
    return sub === '.' ? candidate(pkg.root+'/src/index') : undefined
  }
  const resolved = ts.resolveModuleName(spec,path.join(root,from),opts.get(p) || {},ts.sys).resolvedModule?.resolvedFileName
  if (resolved) {
    const r = rel(resolved)
    if (fileSet.has(r)) return r
  }
}
const edges = [], unresolved = [], packagesUsed = {}, nonliteral = []
function add(from,node,spec,kind,typeOnly=false) {
  const to = resolve(from,spec)
  const line = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line+1
  if (to) edges.push({from,to,kind,typeOnly,line,spec})
  else if (spec.startsWith('.') || spec.startsWith('@/') || Object.keys(packages).some(p=>spec===p||spec.startsWith(p+'/'))) unresolved.push({from,spec,kind,line})
  else {
    const pkg = spec.startsWith('@') ? spec.split('/').slice(0,2).join('/') : spec.split('/')[0]
    const key = scope(from)
    const p = packagesUsed[key] ||= {}
    const record = p[pkg] ||= {runtime:0,test:0,typeOnly:0,examples:[]}
    record[isTest(from)?'test':typeOnly?'typeOnly':'runtime']++
    if (record.examples.length<5) record.examples.push({from,line,spec})
  }
}
for (const f of source) {
  const sf = ts.createSourceFile(f,read(f),ts.ScriptTarget.Latest,true)
  const literal = n => n && ts.isStringLiteralLike(n)
  function visit(n) {
    if ((ts.isImportDeclaration(n)||ts.isExportDeclaration(n))&&literal(n.moduleSpecifier)) {
      const clause = n.importClause
      const allNamedTypes = clause && !clause.name && clause.namedBindings && ts.isNamedImports(clause.namedBindings) && clause.namedBindings.elements.length>0 && clause.namedBindings.elements.every(e=>e.isTypeOnly)
      const allExportTypes = ts.isExportDeclaration(n) && n.exportClause && ts.isNamedExports(n.exportClause) && n.exportClause.elements.length>0 && n.exportClause.elements.every(e=>e.isTypeOnly)
      add(f,n,n.moduleSpecifier.text,ts.isImportDeclaration(n)?'import':'export',!!(n.isTypeOnly||clause?.isTypeOnly||allNamedTypes||allExportTypes))
    } else if (ts.isImportEqualsDeclaration(n)&&ts.isExternalModuleReference(n.moduleReference)&&literal(n.moduleReference.expression)) {
      add(f,n,n.moduleReference.expression.text,'import-equals',!!n.isTypeOnly)
    } else if(ts.isImportTypeNode(n)&&ts.isLiteralTypeNode(n.argument)&&literal(n.argument.literal)) {
      add(f,n,n.argument.literal.text,'import-type',true)
    } else if(ts.isCallExpression(n)&&(n.expression.kind===ts.SyntaxKind.ImportKeyword||(ts.isIdentifier(n.expression)&&n.expression.text==='require'))) {
      if(literal(n.arguments[0])) add(f,n,n.arguments[0].text,'dynamic')
      else nonliteral.push({from:f,line:sf.getLineAndCharacterOfPosition(n.getStart()).line+1})
    }
    ts.forEachChild(n,visit)
  }
  visit(sf)
}
function graph(nodes, links) {
  const adjacency = new Map(nodes.map(n=>[n,new Set()]))
  for (const [a,b] of links) {
    if (!adjacency.has(a)) adjacency.set(a,new Set())
    if (!adjacency.has(b)) adjacency.set(b,new Set())
    adjacency.get(a).add(b)
  }
  let index=0
  const indices=new Map(),low=new Map(),stack=[],active=new Set(),cycles=[]
  function visit(v) {
    indices.set(v,index);low.set(v,index++);stack.push(v);active.add(v)
    for(const w of adjacency.get(v)){
      if(!indices.has(w)){visit(w);low.set(v,Math.min(low.get(v),low.get(w)))}
      else if(active.has(w))low.set(v,Math.min(low.get(v),indices.get(w)))
    }
    if(low.get(v)===indices.get(v)){
      const s=[];let w
      do{w=stack.pop();active.delete(w);s.push(w)}while(w!==v)
      if(s.length>1||adjacency.get(v).has(v))cycles.push(s.sort())
    }
  }
  for(const v of adjacency.keys())if(!indices.has(v))visit(v)
  return {nodes:adjacency.size,edges:[...adjacency.values()].reduce((s,a)=>s+a.size,0),cycles}
}
const productionEdges=edges.filter(e=>!isTest(e.from)&&!isTest(e.to))
const quotient = new Map()
for(const e of productionEdges){
  const a=owner(e.from),b=owner(e.to)
  if(a===b)continue
  const k=JSON.stringify([a,b])
  const list=quotient.get(k)||[]
  list.push(e);quotient.set(k,list)
}
const changes=git('log','--first-parent','--diff-merges=first-parent','--since=180 days ago','--format=COMMIT:%H','--name-only','--no-renames').split('\n')
const history=[]
for(const line of changes){
  if(line.startsWith('COMMIT:'))history.push({sha:line.slice(7),files:[]})
  else if(line.trim()&&history.length)history.at(-1).files.push(line)
}
const cochange={}
for(const c of history){
  c.owners=[...new Set(c.files.map(owner))].sort()
  for(let i=0;i<c.owners.length;i++)for(let j=i+1;j<c.owners.length;j++){
    const k=JSON.stringify([c.owners[i],c.owners[j]])
    cochange[k]=(cochange[k]||0)+1
  }
}
const declared=Object.fromEntries(Object.entries(packages).map(([n,p])=>[n,{root:p.root,dependencies:p.manifest.dependencies||{},devDependencies:p.manifest.devDependencies||{},peerDependencies:p.manifest.peerDependencies||{},exports:p.manifest.exports||{}}]))
const result={commit:git('rev-parse','HEAD').trim(),tree:git('rev-parse','HEAD^{tree}').trim(),typescript:ts.version,trackedFiles:files.length,parsedFiles:source.length,modules:graph(source,productionEdges.map(e=>[e.from,e.to])),runtimeModules:graph(source.filter(f=>!isTest(f)),productionEdges.filter(e=>!e.typeOnly).map(e=>[e.from,e.to])),owners:graph([...new Set(source.filter(f=>!isTest(f)).map(owner))],[...quotient.keys()].map(JSON.parse)),runtimeOwners:graph([...new Set(source.filter(f=>!isTest(f)).map(owner))],productionEdges.filter(e=>!e.typeOnly&&owner(e.from)!==owner(e.to)).map(e=>[owner(e.from),owner(e.to)])),ownerEdges:[...quotient].map(([k,v])=>({owners:JSON.parse(k),evidence:v})),edges,unresolved,nonliteral,packagesUsed,declared,history,cochange:Object.entries(cochange).sort((a,b)=>b[1]-a[1]),limitations:['TS compiler syntax AST; no type-checker symbol liveness, Rust AST, CSS/MDX parser, framework implicit edges, computed imports, or runtime reachability proof. Workspace export fallback is source mapping, not a bundler resolution proof. History is first-parent 180 days and co-change is association, not causal coupling.']}
fs.mkdirSync(path.dirname(output),{recursive:true})
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify({commit:result.commit,parsed:source.length,modules:result.modules,runtimeModules:result.runtimeModules,owners:result.owners,runtimeOwners:result.runtimeOwners,unresolved:unresolved.length,nonliteral:nonliteral.length,history:history.length,topCochange:result.cochange.slice(0,10)},null,2))
