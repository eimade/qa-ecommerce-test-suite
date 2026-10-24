// Calcul des métriques de campagne (fonction pure, testée dans tools/metrics.test.js).
export const SEVERITES = ['Bloquante', 'Majeure', 'Mineure', 'Cosmétique'];
const OUVERTES = new Set(['Ouverte', 'En cours', 'Réouverte']);
const NIVEAUX = { 'Postman/Newman': 'API', Playwright: 'UI (E2E)', autocannon: 'Performance', Manuel: 'Manuel' };

export function campaignMetrics(ref, results, anomalies) {
  const cas = ref.cas.map((c) => {
    const r = results.get(c.key);
    return { ...c, statut: r?.status ?? 'TODO', commentaire: r?.comments?.join(' ; ') ?? (c.type === 'Manuel' ? 'cas manuel' : 'non exécuté') };
  });
  const passes = cas.filter((c) => c.statut === 'PASSED').length;
  const echecs = cas.filter((c) => c.statut === 'FAILED').length;
  const executes = passes + echecs;

  const exigences = ref.exigences.map((e) => {
    const lies = cas.filter((c) => c.exigences.includes(e.id));
    const executesLies = lies.filter((c) => c.statut !== 'TODO');
    const statut = lies.some((c) => c.statut === 'FAILED')
      ? 'NON CONFORME'
      : executesLies.length === 0
        ? 'NON TESTÉE'
        : 'VALIDÉE';
    return { ...e, cas: lies.map((c) => c.key), statut };
  });

  const parOutil = Object.entries(NIVEAUX).map(([outil, niveau]) => {
    const l = cas.filter((c) => c.outil === outil);
    return {
      niveau,
      outil,
      total: l.length,
      passes: l.filter((c) => c.statut === 'PASSED').length,
      echecs: l.filter((c) => c.statut === 'FAILED').length,
      detail: `${l.filter((c) => c.statut === 'TODO').length} non exécuté(s)`,
    };
  }).filter((o) => o.total > 0);

  const parSeverite = SEVERITES.map((severite) => ({
    severite,
    ouvertes: anomalies.filter((a) => a.severite === severite && OUVERTES.has(a.statut)).length,
    fermees: anomalies.filter((a) => a.severite === severite && !OUVERTES.has(a.statut)).length,
  }));
  const anomaliesOuvertes = anomalies.filter((a) => OUVERTES.has(a.statut)).length;
  const anomaliesBloquantes = anomalies.filter((a) => OUVERTES.has(a.statut) && ['Bloquante', 'Majeure'].includes(a.severite)).length;

  const prioritairesOk = cas.filter((c) => ['Critique', 'Haute'].includes(c.priorite) && c.type === 'Automatisé').every((c) => c.statut === 'PASSED');
  const verdict = prioritairesOk && echecs === 0 && anomaliesBloquantes === 0 ? 'GO' : 'NO GO';

  return {
    total: cas.length,
    passes,
    echecs,
    executes,
    todo: cas.length - executes,
    tauxReussite: executes ? passes / executes : 0,
    exigences,
    exigencesValidees: exigences.filter((e) => e.statut === 'VALIDÉE').length,
    parOutil,
    parSeverite,
    anomaliesOuvertes,
    anomaliesBloquantes,
    nonPasses: cas.filter((c) => c.statut !== 'PASSED'),
    verdict,
  };
}
