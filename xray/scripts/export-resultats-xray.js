// Convertit les rapports de la campagne (Newman, Playwright, autocannon) au format d'import
// de résultats Xray. SIMULATION : aucun appel à JIRA ; le fichier produit est celui qu'on
// enverrait à l'API d'import Xray (voir README, section « Simulations »).
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildXrayExecution, fromNewman, fromPerf, fromPlaywright, mergeAll, readJson } from './lib.js';

const referentiel = readJson('xray/referentiel-tests.json');
const results = mergeAll(
  fromNewman(readJson('reports/newman/newman.json', null)),
  fromPlaywright(readJson('reports/playwright/results.json', null)),
  fromPerf(readJson('reports/perf/perf.json', null)),
);

if (results.size === 0) {
  console.error('Aucun rapport trouvé dans reports/ : lancez d abord test:api, test:e2e et/ou test:perf.');
  process.exit(1);
}

const execution = buildXrayExecution(referentiel, results, {
  summary: `Campagne de régression Uimad QA ${referentiel.version}`,
  environment: process.env.CI ? 'ci' : 'local',
  revision: process.env.GITHUB_SHA ?? process.env.BUILD_SOURCEVERSION ?? 'locale',
});

mkdirSync('reports/xray', { recursive: true });
writeFileSync('reports/xray/execution-xray.json', JSON.stringify(execution, null, 2));

const count = (s) => execution.tests.filter((t) => t.status === s).length;
console.log(`reports/xray/execution-xray.json : ${execution.tests.length} cas (PASSED ${count('PASSED')}, FAILED ${count('FAILED')}, TODO ${count('TODO')})`);
console.log('Import simulé. Commande réelle (Xray Cloud) :');
console.log('  curl -H "Authorization: Bearer $XRAY_TOKEN" -H "Content-Type: application/json" \\');
console.log('       --data @reports/xray/execution-xray.json https://xray.cloud.getxray.app/api/v2/import/execution');
