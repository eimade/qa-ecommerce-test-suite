// Rapport de campagne de tests (Markdown) à partir des rapports réels de l'exécution.
// Usage : npm run report            -> reports/rapport-campagne.md (artefact CI)
//         npm run report -- --docs  -> docs/07-rapport-campagne.md (instantané versionné)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fromNewman, fromPerf, fromPlaywright, mergeAll, readJson } from '../xray/scripts/lib.js';
import { campaignMetrics } from './metrics.js';

const ref = readJson('xray/referentiel-tests.json');
const { anomalies } = readJson('xray/anomalies.json');
const newman = readJson('reports/newman/newman.json', null);
const results = mergeAll(
  fromNewman(newman),
  fromPlaywright(readJson('reports/playwright/results.json', null)),
  fromPerf(readJson('reports/perf/perf.json', null)),
);
const perf = readJson('reports/perf/perf.json', null);

function junitTotals(path) {
  if (!existsSync(path)) return null;
  const xml = readFileSync(path, 'utf8');
  const root = xml.match(/<testsuites[^>]*>/)?.[0] ?? '';
  const attr = (n) => Number(root.match(new RegExp(`${n}="(\\d+)"`))?.[1] ?? 0);
  return { tests: attr('tests'), failures: attr('failures') + attr('errors') };
}
const unit = junitTotals('reports/unit/junit.xml');

const m = campaignMetrics(ref, results, anomalies);
const pct = (x) => `${(x * 100).toFixed(1)} %`;
const date = new Date().toISOString().slice(0, 10);

const lines = [
  `# Rapport de campagne de tests - Uimad QA ${ref.version}`,
  '',
  `> Généré le ${date} par \`npm run report\` à partir des rapports Newman, Playwright, autocannon et Vitest de l'exécution.`,
  '',
  `Environnement : ${process.env.CAMPAGNE_ENV ?? (process.env.CI ? 'CI (agent Linux, boutique Node.js native)' : 'poste local')}`,
  '',
  '## Synthèse',
  '',
  `- **Verdict : ${m.verdict}** (critère de sortie : 100 % des cas critiques et hauts réussis, aucune anomalie bloquante ou majeure ouverte)`,
  `- Cas exécutés : ${m.executes} / ${m.total} (${pct(m.executes / m.total)}) ; non exécutés : ${m.todo} (cas manuels hors CI)`,
  `- Taux de réussite des cas exécutés : **${pct(m.tauxReussite)}** (${m.passes} réussis, ${m.echecs} en échec)`,
  `- Exigences validées : ${m.exigencesValidees} / ${ref.exigences.length} (${pct(m.exigencesValidees / ref.exigences.length)})`,
  `- Anomalies ouvertes : ${m.anomaliesOuvertes} (bloquantes ou majeures : ${m.anomaliesBloquantes})`,
  '',
  '## Résultats par outil',
  '',
  '| Niveau | Outil | Cas | Réussis | Échecs | Détail |',
  '|---|---|---|---|---|---|',
  ...m.parOutil.map((o) => `| ${o.niveau} | ${o.outil} | ${o.total} | ${o.passes} | ${o.echecs} | ${o.detail} |`),
  unit ? `| Développement | Vitest (unitaires + intégration API) | ${unit.tests} tests | ${unit.tests - unit.failures} | ${unit.failures} | hors référentiel Xray |` : '',
  newman ? `| | Newman (assertions) | ${newman.run.stats.assertions.total} assertions | ${newman.run.stats.assertions.total - newman.run.stats.assertions.failed} | ${newman.run.stats.assertions.failed} | ${newman.run.stats.requests.total} requêtes |` : '',
  '',
  '## Performance (SHOP-301)',
  '',
  perf
    ? `| Requêtes | Débit moyen | Latence p50 | p90 | p99 (seuil ${perf.seuils.p99Ms} ms) | Erreurs | Statut |\n|---|---|---|---|---|---|---|\n| ${perf.mesures.requetes} | ${perf.mesures.reqParSecMoyenne} req/s | ${perf.mesures.latenceP50Ms} ms | ${perf.mesures.latenceP90Ms} ms | ${perf.mesures.latenceP99Ms} ms | ${perf.mesures.erreurs + perf.mesures.non2xx} | ${perf.statut} |`
    : 'Non exécuté.',
  '',
  '## Couverture des exigences',
  '',
  '| Exigence | Criticité | Cas | Statut |',
  '|---|---|---|---|',
  ...m.exigences.map((e) => `| ${e.id} ${e.titre} | ${e.criticite} | ${e.cas.join(', ')} | ${e.statut} |`),
  '',
  '## Cas en échec ou non exécutés',
  '',
  ...(m.nonPasses.length ? m.nonPasses.map((c) => `- ${c.key} ${c.titre} : **${c.statut}**${c.commentaire ? ` - ${c.commentaire}` : ''}`) : ['Aucun.']),
  '',
  '## Anomalies par sévérité',
  '',
  '| Sévérité | Ouvertes | Corrigées / fermées |',
  '|---|---|---|',
  ...m.parSeverite.map((s) => `| ${s.severite} | ${s.ouvertes} | ${s.fermees} |`),
  '',
  ...anomalies.map((a) => `- ${a.id} (${a.severite}, ${a.statut}) : ${a.titre} - cas ${a.casDeTest}, exigence ${a.exigence}`),
  '',
  '## Recommandation',
  '',
  m.verdict === 'GO'
    ? 'Livraison recommandée. Les cas manuels (accessibilité clavier, affichage mobile) restent à exécuter avant la mise en production ; l anomalie mineure ouverte est à arbitrer par le PO au prochain PI planning ou affinage.'
    : 'Livraison déconseillée en l état : corriger les échecs listés ci-dessus et relancer la campagne de régression.',
  '',
];

const toDocs = process.argv.includes('--docs');
const out = toDocs ? 'docs/07-rapport-campagne.md' : 'reports/rapport-campagne.md';
mkdirSync(toDocs ? 'docs' : 'reports', { recursive: true });
writeFileSync(out, lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n'));
console.log(`${out} : verdict ${m.verdict}, réussite ${pct(m.tauxReussite)}, ${m.executes}/${m.total} cas exécutés`);
