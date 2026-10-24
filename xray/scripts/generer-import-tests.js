// Génère, depuis la source unique xray/referentiel-tests.json :
//  - xray/import/tests-xray.json : import en masse des cas de test (format JSON Xray Cloud) ;
//  - xray/import/tests-xray.csv  : même contenu pour le « Test Case Importer » CSV ;
//  - docs/03-matrice-tracabilite.md : matrice exigences <-> cas de test.
// Échoue (code 1) si le référentiel est incohérent ou si un cas automatisé n'existe pas dans le code.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { checkReferentiel, readJson } from './lib.js';

const ref = readJson('xray/referentiel-tests.json');
const problems = checkReferentiel(ref);

// Détection de dérive : chaque cas automatisé doit être réellement implémenté.
const sources = {
  'Postman/Newman': readFileSync('tests/api/uimad-qa.postman_collection.json', 'utf8'),
  Playwright: readdirSync('tests/e2e').filter((f) => f.endsWith('.spec.ts')).map((f) => readFileSync(`tests/e2e/${f}`, 'utf8')).join('\n'),
  autocannon: readFileSync('tests/perf/charge-catalogue.js', 'utf8'),
};
for (const c of ref.cas.filter((x) => x.type === 'Automatisé')) {
  if (!sources[c.outil]?.includes(c.key)) problems.push(`${c.key} (${c.outil}) n'est pas implémenté dans le code de test`);
}
if (problems.length) {
  console.error(`Référentiel incohérent :\n - ${problems.join('\n - ')}`);
  process.exit(1);
}

const folderOf = (c) => `/Uimad QA/${c.outil === 'Manuel' ? 'Manuels' : c.outil.split('/')[0]}`;

// ---- JSON Xray ----
const jsonImport = ref.cas.map((c) => ({
  // Les cas existent déjà dans JIRA (création préalable) : update_key met à jour le ticket existant.
  update_key: c.key,
  testtype: 'Manual',
  fields: {
    summary: c.titre,
    project: { key: ref.projet },
    priority: { name: c.priorite },
    labels: [c.type === 'Manuel' ? 'manuel' : 'automatise', c.outil.split('/')[0].toLowerCase(), ...c.exigences],
    description: `Exigences couvertes : ${c.exigences.join(', ')}\nJeux de données : ${c.jdd.join(', ') || 'aucun'}\nAutomatisation : ${c.outil}`,
  },
  xray_test_repository_folder: folderOf(c),
  steps: c.etapes.map((e) => ({ action: e.action, data: e.donnees, result: e.attendu })),
}));

// ---- CSV Xray (une ligne par étape, l'identifiant regroupe les étapes d'un même cas) ----
const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
const header = ['Test ID', 'Issue Key', 'Summary', 'Test Type', 'Priority', 'Labels', 'Requirement', 'Repository Folder', 'Action', 'Data', 'Expected Result'];
const rows = [header.map(esc).join(',')];
ref.cas.forEach((c, i) => {
  c.etapes.forEach((e, j) => {
    const first = j === 0;
    rows.push([
      i + 1,
      first ? c.key : '',
      first ? c.titre : '',
      first ? 'Manual' : '',
      first ? c.priorite : '',
      first ? [c.type === 'Manuel' ? 'manuel' : 'automatise', c.outil.split('/')[0].toLowerCase()].join(' ') : '',
      first ? c.exigences.join(' ') : '',
      first ? folderOf(c) : '',
      e.action,
      e.donnees,
      e.attendu,
    ].map(esc).join(','));
  });
});

// ---- Matrice de traçabilité ----
const md = [
  '# Matrice de traçabilité exigences <-> cas de test',
  '',
  '> Document généré par `npm run xray:cases` depuis `xray/referentiel-tests.json` (source unique). Ne pas éditer à la main.',
  '',
  `Plan de test : **${ref.testPlanKey}**. ${ref.exigences.length} exigences, ${ref.cas.length} cas de test ` +
    `(${ref.cas.filter((c) => c.type === 'Automatisé').length} automatisés, ${ref.cas.filter((c) => c.type === 'Manuel').length} manuels).`,
  '',
  '## Couverture par exigence',
  '',
  '| Exigence | Module | Criticité | Libellé | Cas API | Cas UI | Autres |',
  '|---|---|---|---|---|---|---|',
  ...ref.exigences.map((e) => {
    const cas = ref.cas.filter((c) => c.exigences.includes(e.id));
    const pick = (pred) => cas.filter(pred).map((c) => c.key).join(', ') || '-';
    return `| ${e.id} | ${e.module} | ${e.criticite} | ${e.titre} | ${pick((c) => c.outil === 'Postman/Newman')} | ${pick((c) => c.outil === 'Playwright')} | ${pick((c) => !['Postman/Newman', 'Playwright'].includes(c.outil))} |`;
  }),
  '',
  '## Liste des cas de test',
  '',
  '| Clé | Titre | Type | Outil | Priorité | Exigences | Jeux de données |',
  '|---|---|---|---|---|---|---|',
  ...ref.cas.map((c) => `| ${c.key} | ${c.titre} | ${c.type} | ${c.outil} | ${c.priorite} | ${c.exigences.join(', ')} | ${c.jdd.join(', ') || '-'} |`),
  '',
];

mkdirSync('xray/import', { recursive: true });
writeFileSync('xray/import/tests-xray.json', JSON.stringify(jsonImport, null, 2) + '\n');
writeFileSync('xray/import/tests-xray.csv', rows.join('\n') + '\n');
writeFileSync('docs/03-matrice-tracabilite.md', md.join('\n'));
console.log(`Référentiel cohérent : ${ref.exigences.length} exigences couvertes, ${ref.cas.length} cas exportés (JSON, CSV, matrice).`);
