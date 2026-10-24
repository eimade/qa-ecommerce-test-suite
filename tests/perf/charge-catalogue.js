// SHOP-301 - Test de charge léger du catalogue (exigence EX-NF-01).
// Profil : 25 connexions simultanées pendant 10 s sur GET /api/products et GET /api/products/:id.
// Critères d'acceptation : 0 erreur réseau, 0 réponse non-2xx, latence p99 < 250 ms, débit >= 300 req/s.
import autocannon from 'autocannon';
import { mkdirSync, writeFileSync } from 'node:fs';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:13100';
const SEUILS = { p99Ms: Number(process.env.PERF_P99_MS ?? 250), minReqPerSec: Number(process.env.PERF_MIN_RPS ?? 300) };

const startedAt = new Date().toISOString();
const result = await autocannon({
  url: baseUrl,
  connections: Number(process.env.PERF_CONNECTIONS ?? 25),
  duration: Number(process.env.PERF_DURATION_S ?? 10),
  requests: [
    { method: 'GET', path: '/api/products' },
    { method: 'GET', path: '/api/products?category=maison' },
    { method: 'GET', path: '/api/products/p-007' },
  ],
});
const finishedAt = new Date().toISOString();

const mesures = {
  requetes: result.requests.total,
  reqParSecMoyenne: result.requests.average,
  latenceMoyenneMs: result.latency.average,
  latenceP50Ms: result.latency.p50,
  latenceP90Ms: result.latency.p90,
  latenceP99Ms: result.latency.p99,
  erreurs: result.errors + result.timeouts,
  non2xx: result.non2xx,
};

const echecs = [];
if (mesures.erreurs > 0) echecs.push(`${mesures.erreurs} erreur(s) réseau ou timeout`);
if (mesures.non2xx > 0) echecs.push(`${mesures.non2xx} réponse(s) non-2xx`);
if (mesures.latenceP99Ms >= SEUILS.p99Ms) echecs.push(`p99 ${mesures.latenceP99Ms} ms >= ${SEUILS.p99Ms} ms`);
if (mesures.reqParSecMoyenne < SEUILS.minReqPerSec) echecs.push(`débit ${mesures.reqParSecMoyenne} req/s < ${SEUILS.minReqPerSec}`);

const rapport = { testKey: 'SHOP-301', startedAt, finishedAt, seuils: SEUILS, mesures, statut: echecs.length ? 'FAILED' : 'PASSED', echecs };
mkdirSync('reports/perf', { recursive: true });
writeFileSync('reports/perf/perf.json', JSON.stringify(rapport, null, 2));

console.table(mesures);
console.log(echecs.length ? `ECHEC SHOP-301 : ${echecs.join(' ; ')}` : 'SHOP-301 PASSED : critères de performance respectés');
process.exit(echecs.length ? 1 : 0);
