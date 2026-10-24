// Fonctions pures partagées par les scripts Xray et le rapport de campagne (testées unitairement).
import { existsSync, readFileSync } from 'node:fs';

export const KEY_RE = /\bSHOP-\d{3}\b/;

export function readJson(path, fallback = undefined) {
  if (!existsSync(path)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Fichier introuvable : ${path}`);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Fusionne un résultat dans la table : un cas est FAILED dès qu'une de ses exécutions échoue. */
function merge(table, key, r) {
  const prev = table.get(key);
  if (!prev) {
    table.set(key, { ...r, comments: r.comments ?? [] });
    return;
  }
  prev.status = prev.status === 'FAILED' || r.status === 'FAILED' ? 'FAILED' : prev.status;
  prev.start = prev.start < r.start ? prev.start : r.start;
  prev.finish = prev.finish > r.finish ? prev.finish : r.finish;
  prev.comments.push(...(r.comments ?? []));
}

/** Rapport JSON Newman -> résultats par clé Xray (la clé est portée par le nom de la requête). */
export function fromNewman(report) {
  const table = new Map();
  if (!report?.run) return table;
  const start = new Date(report.run.timings.started).toISOString();
  const finish = new Date(report.run.timings.completed).toISOString();
  for (const exec of report.run.executions ?? []) {
    const key = exec.item?.name?.match(KEY_RE)?.[0];
    if (!key) continue;
    const failures = (exec.assertions ?? []).filter((a) => a.error).map((a) => `${exec.item.name} : ${a.assertion} -> ${a.error.message}`);
    if (exec.requestError) failures.push(`${exec.item.name} : erreur réseau ${exec.requestError.message ?? ''}`.trim());
    merge(table, key, {
      status: failures.length ? 'FAILED' : 'PASSED',
      start,
      finish,
      source: 'Newman',
      comments: failures,
    });
  }
  return table;
}

function* walkSpecs(suite) {
  for (const spec of suite.specs ?? []) yield spec;
  for (const child of suite.suites ?? []) yield* walkSpecs(child);
}

/** Rapport JSON Playwright -> résultats par clé Xray (la clé est portée par le titre du test). */
export function fromPlaywright(report) {
  const table = new Map();
  for (const root of report?.suites ?? []) {
    for (const spec of walkSpecs(root)) {
      const key = spec.title.match(KEY_RE)?.[0];
      if (!key) continue;
      for (const t of spec.tests ?? []) {
        const results = t.results ?? [];
        const first = results[0];
        const last = results[results.length - 1];
        const start = first ? new Date(first.startTime).toISOString() : new Date().toISOString();
        const finish = last ? new Date(new Date(last.startTime).getTime() + (last.duration ?? 0)).toISOString() : start;
        const status = t.status === 'unexpected' ? 'FAILED' : t.status === 'skipped' ? 'TODO' : 'PASSED';
        const comments = [];
        if (t.status === 'flaky') comments.push(`${spec.title} : instable (réussi après ${results.length - 1} relance(s))`);
        if (status === 'FAILED') comments.push(`${spec.title} : ${(last?.error?.message ?? 'échec').split('\n')[0]}`);
        merge(table, key, { status, start, finish, source: 'Playwright', comments });
      }
    }
  }
  return table;
}

/** Rapport du test de performance (tests/perf) -> résultat SHOP-301. */
export function fromPerf(report) {
  const table = new Map();
  if (!report?.testKey) return table;
  const m = report.mesures;
  table.set(report.testKey, {
    status: report.statut,
    start: report.startedAt,
    finish: report.finishedAt,
    source: 'autocannon',
    comments: [`p99 ${m.latenceP99Ms} ms, ${m.reqParSecMoyenne} req/s, ${m.erreurs} erreur(s), ${m.non2xx} non-2xx`, ...report.echecs],
  });
  return table;
}

export function mergeAll(...tables) {
  const all = new Map();
  for (const t of tables) for (const [k, v] of t) merge(all, k, v);
  return all;
}

/**
 * Construit le corps « Xray JSON format » d'import de résultats d'exécution
 * (POST /rest/raven/1.0/import/execution sur Server/DC, /api/v2/import/execution sur Cloud).
 * Les cas sans résultat (manuels ou non exécutés) sont envoyés au statut TODO.
 */
export function buildXrayExecution(referentiel, results, { summary, environment, revision }) {
  const dates = [...results.values()].flatMap((r) => [r.start, r.finish]).sort();
  const now = new Date().toISOString();
  return {
    info: {
      summary,
      description: `Exécution automatisée générée depuis les rapports Newman, Playwright et autocannon (révision ${revision}).`,
      version: referentiel.version,
      revision,
      startDate: dates[0] ?? now,
      finishDate: dates[dates.length - 1] ?? now,
      testPlanKey: referentiel.testPlanKey,
      testEnvironments: [environment],
    },
    tests: referentiel.cas.map((c) => {
      const r = results.get(c.key);
      if (!r) return { testKey: c.key, status: 'TODO', comment: c.type === 'Manuel' ? 'Cas manuel : à exécuter par un testeur' : 'Non exécuté dans cette campagne' };
      return {
        testKey: c.key,
        start: r.start,
        finish: r.finish,
        status: r.status,
        comment: [`Source : ${r.source}`, ...r.comments].join('\n'),
      };
    }),
  };
}

/** Vérifications de cohérence du référentiel : chaque exigence est couverte, chaque lien est valide. */
export function checkReferentiel(referentiel) {
  const problems = [];
  const reqIds = new Set(referentiel.exigences.map((e) => e.id));
  const keys = new Set();
  for (const c of referentiel.cas) {
    if (!KEY_RE.test(c.key)) problems.push(`Clé invalide : ${c.key}`);
    if (keys.has(c.key)) problems.push(`Clé en double : ${c.key}`);
    keys.add(c.key);
    for (const e of c.exigences) if (!reqIds.has(e)) problems.push(`${c.key} référence une exigence inconnue : ${e}`);
    if (!c.etapes?.length) problems.push(`${c.key} n'a aucune étape`);
  }
  for (const id of reqIds) {
    if (!referentiel.cas.some((c) => c.exigences.includes(id))) problems.push(`Exigence non couverte : ${id}`);
  }
  return problems;
}
