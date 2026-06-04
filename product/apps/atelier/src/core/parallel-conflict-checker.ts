import { readFileSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'

export type CandidatePacket = {
  packet_id: string
  allowed_files: string[]
  forbidden_roots: string[]
  fixture_families: string[]
  command_surfaces: string[]
  generated_state_paths: string[]
  durable_evidence_paths: string[]
}

export type InFlightPacket = {
  packet_id: string
  dispatch_time: string
  allowed_files: string[]
  forbidden_roots: string[]
  fixture_families: string[]
  command_surfaces: string[]
  generated_state_paths: string[]
  durable_evidence_paths: string[]
}

export type ConflictKind =
  | 'allowed_files'
  | 'forbidden_roots'
  | 'fixture_family'
  | 'command_surface'
  | 'generated_state'
  | 'durable_evidence'

export type ConflictReport = {
  packet_id: string
  candidate_path: string
  in_flight_path: string
  conflict_kind: ConflictKind
  details: string
}

export type ConflictCheckResult = {
  status: 'passed' | 'failed'
  candidate_packet_id: string
  conflicting_packet_ids: string[]
  reports: ConflictReport[]
  inflight_packet_count: number
  ran_at: string
}

export type InFlightFile = {
  schema: string
  file_id: string
  in_flight_packets: InFlightPacket[]
}

const GLOB_META = /[*?[\]{}]/

function toPosix(p: string): string {
  return p.split(path.sep).join('/')
}

function isGlob(value: string): boolean {
  return GLOB_META.test(value)
}

function globToRegex(glob: string): RegExp {
  const norm = toPosix(glob)
  let pattern = ''
  let i = 0
  while (i < norm.length) {
    const c = norm[i]!
    if (c === '*' && norm[i + 1] === '*') {
      pattern += '.*'
      i += 2
      if (norm[i] === '/') i += 1
    } else if (c === '*') {
      pattern += '[^/]*'
      i += 1
    } else if (c === '?') {
      pattern += '[^/]'
      i += 1
    } else if (c === '[') {
      const end = norm.indexOf(']', i + 1)
      if (end === -1) {
        pattern += '\\['
        i += 1
      } else {
        const inner = norm.slice(i + 1, end)
        pattern += '[' + inner + ']'
        i = end + 1
      }
    } else if ('.+^$()|{}\\'.includes(c)) {
      pattern += '\\' + c
      i += 1
    } else {
      pattern += c
      i += 1
    }
  }
  return new RegExp('^' + pattern + '$')
}

function isUnderDir(candidate: string, dir: string): boolean {
  return candidate === dir || candidate.startsWith(dir + '/')
}

function stripTrailingStar(p: string): string {
  return p.replace(/\*+$/, '')
}

function patternsIntersect(a: string, b: string): boolean {
  const an = toPosix(a)
  const bn = toPosix(b)
  if (an === bn) return true
  const aGlob = isGlob(an)
  const bGlob = isGlob(bn)
  if (!aGlob && !bGlob) {
    return an === bn || isUnderDir(an, bn) || isUnderDir(bn, an)
  }
  if (aGlob && !bGlob) {
    const aRe = globToRegex(an)
    if (aRe.test(bn)) return true
    return isUnderDir(bn, stripTrailingStar(an))
  }
  if (!aGlob && bGlob) {
    const bRe = globToRegex(bn)
    if (bRe.test(an)) return true
    return isUnderDir(an, stripTrailingStar(bn))
  }
  const aPrefix = an.split('*')[0] ?? ''
  const bPrefix = bn.split('*')[0] ?? ''
  if (aPrefix === '' || bPrefix === '') {
    return aPrefix.startsWith(bPrefix.slice(0, Math.min(bPrefix.length, aPrefix.length))) ||
      bPrefix.startsWith(aPrefix.slice(0, Math.min(aPrefix.length, bPrefix.length)))
  }
  return aPrefix.startsWith(bPrefix) || bPrefix.startsWith(aPrefix)
}

function intersectLists<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b)
  return a.filter((x) => setB.has(x))
}

export function checkConflicts(
  candidate: CandidatePacket,
  inflight: InFlightPacket[],
): ConflictCheckResult {
  const reports: ConflictReport[] = []
  const conflictingIds = new Set<string>()

  for (const pkt of inflight) {
    for (const cap of candidate.allowed_files) {
      for (const pcap of pkt.allowed_files) {
        if (patternsIntersect(cap, pcap)) {
          reports.push({
            packet_id: pkt.packet_id,
            candidate_path: cap,
            in_flight_path: pcap,
            conflict_kind: 'allowed_files',
            details: `candidate.allowed_files "${cap}" intersects in-flight packet ${pkt.packet_id} allowed_files "${pcap}"`,
          })
          conflictingIds.add(pkt.packet_id)
        }
      }
    }

    for (const fr of candidate.forbidden_roots) {
      for (const pcap of pkt.allowed_files) {
        if (patternsIntersect(fr, pcap)) {
          reports.push({
            packet_id: pkt.packet_id,
            candidate_path: fr,
            in_flight_path: pcap,
            conflict_kind: 'forbidden_roots',
            details: `candidate.forbidden_roots "${fr}" intersects in-flight packet ${pkt.packet_id} allowed_files "${pcap}"`,
          })
          conflictingIds.add(pkt.packet_id)
        }
      }
    }

    for (const fr of pkt.forbidden_roots) {
      for (const cap of candidate.allowed_files) {
        if (patternsIntersect(fr, cap)) {
          reports.push({
            packet_id: pkt.packet_id,
            candidate_path: cap,
            in_flight_path: fr,
            conflict_kind: 'forbidden_roots',
            details: `candidate.allowed_files "${cap}" intersects in-flight packet ${pkt.packet_id} forbidden_roots "${fr}"`,
          })
          conflictingIds.add(pkt.packet_id)
        }
      }
    }

    const famOverlap = intersectLists(candidate.fixture_families, pkt.fixture_families)
    for (const f of famOverlap) {
      reports.push({
        packet_id: pkt.packet_id,
        candidate_path: f,
        in_flight_path: f,
        conflict_kind: 'fixture_family',
        details: `fixture family "${f}" is claimed by both candidate and in-flight packet ${pkt.packet_id}`,
      })
      conflictingIds.add(pkt.packet_id)
    }

    const cmdOverlap = intersectLists(candidate.command_surfaces, pkt.command_surfaces)
    for (const c of cmdOverlap) {
      reports.push({
        packet_id: pkt.packet_id,
        candidate_path: c,
        in_flight_path: c,
        conflict_kind: 'command_surface',
        details: `command surface "${c}" is claimed by both candidate and in-flight packet ${pkt.packet_id}`,
      })
      conflictingIds.add(pkt.packet_id)
    }

    for (const g of candidate.generated_state_paths) {
      for (const pg of pkt.generated_state_paths) {
        if (patternsIntersect(g, pg)) {
          reports.push({
            packet_id: pkt.packet_id,
            candidate_path: g,
            in_flight_path: pg,
            conflict_kind: 'generated_state',
            details: `candidate.generated_state_paths "${g}" intersects in-flight packet ${pkt.packet_id} generated_state_paths "${pg}"`,
          })
          conflictingIds.add(pkt.packet_id)
        }
      }
    }

    for (const d of candidate.durable_evidence_paths) {
      for (const pd of pkt.durable_evidence_paths) {
        if (patternsIntersect(d, pd)) {
          reports.push({
            packet_id: pkt.packet_id,
            candidate_path: d,
            in_flight_path: pd,
            conflict_kind: 'durable_evidence',
            details: `candidate.durable_evidence_paths "${d}" intersects in-flight packet ${pkt.packet_id} durable_evidence_paths "${pd}"`,
          })
          conflictingIds.add(pkt.packet_id)
        }
      }
    }
  }

  return {
    status: conflictingIds.size === 0 ? 'passed' : 'failed',
    candidate_packet_id: candidate.packet_id,
    conflicting_packet_ids: Array.from(conflictingIds).sort(),
    reports,
    inflight_packet_count: inflight.length,
    ran_at: new Date().toISOString(),
  }
}

export function loadInFlightPackets(inFlightFilePath: string): InFlightPacket[] {
  const text = readFileSync(inFlightFilePath, 'utf8')
  const parsed = parse(text) as Partial<InFlightFile>
  if (!parsed || !Array.isArray(parsed.in_flight_packets)) return []
  return parsed.in_flight_packets
}

export function runConflictCheck(opts: {
  candidate: CandidatePacket
  inFlightFilePath: string
}): ConflictCheckResult {
  const inflight = loadInFlightPackets(opts.inFlightFilePath)
  return checkConflicts(opts.candidate, inflight)
}
