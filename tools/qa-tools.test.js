import { describe, expect, it } from 'vitest';
import { buildXrayExecution, checkReferentiel, fromNewman, fromPlaywright, mergeAll } from '../xray/scripts/lib.js';
import { campaignMetrics } from './metrics.js';

const ref = {
  projet: 'SHOP',
  testPlanKey: 'SHOP-100',
  version: '1.0.0',
  exigences: [
    { id: 'EX-A', titre: 'A', criticite: 'Haute' },
    { id: 'EX-B', titre: 'B', criticite: 'Moyenne' },
  ],
  cas: [
    { key: 'SHOP-101', titre: 'api', exigences: ['EX-A'], type: 'Automatisé', outil: 'Postman/Newman', priorite: 'Haute', etapes: [{}] },
    { key: 'SHOP-201', titre: 'ui', exigences: ['EX-A', 'EX-B'], type: 'Automatisé', outil: 'Playwright', priorite: 'Moyenne', etapes: [{}] },
    { key: 'SHOP-401', titre: 'manuel', exigences: ['EX-B'], type: 'Manuel', outil: 'Manuel', priorite: 'Basse', etapes: [{}] },
  ],
};

const newmanReport = {
  run: {
    timings: { started: 1761300000000, completed: 1761300003000 },
    executions: [
      { item: { name: 'Préparation' }, assertions: [] },
      { item: { name: 'SHOP-101 | lister' }, assertions: [{ assertion: 'Statut 200' }] },
      { item: { name: 'SHOP-101 | filtrer' }, assertions: [{ assertion: 'Statut 400', error: { message: 'expected 200 to be 400' } }] },
    ],
  },
};

const playwrightReport = {
  suites: [{
    title: 'spec.ts',
    suites: [{
      title: 'Parcours',
      specs: [{ title: 'SHOP-201 Achat @smoke', tests: [{ status: 'flaky', results: [
        { status: 'failed', startTime: '2026-10-24T10:00:00.000Z', duration: 1000 },
        { status: 'passed', startTime: '2026-10-24T10:00:02.000Z', duration: 1500 },
      ] }] }],
    }],
  }],
};

describe('conversion des rapports vers Xray', () => {
  it('Newman : un cas est FAILED si une de ses requêtes échoue, les requêtes sans clé sont ignorées', () => {
    const t = fromNewman(newmanReport);
    expect([...t.keys()]).toEqual(['SHOP-101']);
    expect(t.get('SHOP-101').status).toBe('FAILED');
    expect(t.get('SHOP-101').comments[0]).toContain('expected 200 to be 400');
  });

  it('Playwright : un test instable est PASSED avec un commentaire, durée calculée sur toutes les tentatives', () => {
    const r = fromPlaywright(playwrightReport).get('SHOP-201');
    expect(r.status).toBe('PASSED');
    expect(r.comments[0]).toMatch(/instable/);
    expect(r.start).toBe('2026-10-24T10:00:00.000Z');
    expect(r.finish).toBe('2026-10-24T10:00:03.500Z');
  });

  it('produit un JSON d exécution Xray avec TODO pour les cas sans résultat', () => {
    const exec = buildXrayExecution(ref, mergeAll(fromNewman(newmanReport), fromPlaywright(playwrightReport)), {
      summary: 'Campagne', environment: 'ci', revision: 'abc',
    });
    expect(exec.info).toMatchObject({ testPlanKey: 'SHOP-100', testEnvironments: ['ci'], revision: 'abc' });
    expect(exec.tests.map((t) => [t.testKey, t.status])).toEqual([
      ['SHOP-101', 'FAILED'], ['SHOP-201', 'PASSED'], ['SHOP-401', 'TODO'],
    ]);
  });
});

describe('cohérence du référentiel', () => {
  it('signale exigence non couverte, lien cassé et clé en double', () => {
    const broken = {
      ...ref,
      exigences: [...ref.exigences, { id: 'EX-C', titre: 'C' }],
      cas: [...ref.cas, { ...ref.cas[0], exigences: ['EX-Z'] }],
    };
    expect(checkReferentiel(broken)).toEqual([
      'Clé en double : SHOP-101',
      'SHOP-101 référence une exigence inconnue : EX-Z',
      'Exigence non couverte : EX-C',
    ]);
    expect(checkReferentiel(ref)).toEqual([]);
  });
});

describe('métriques de campagne', () => {
  it('calcule taux de réussite, statut des exigences, anomalies par sévérité et verdict', () => {
    const results = mergeAll(fromNewman(newmanReport), fromPlaywright(playwrightReport));
    const m = campaignMetrics(ref, results, [
      { severite: 'Majeure', statut: 'Ouverte' },
      { severite: 'Mineure', statut: 'Fermée' },
    ]);
    expect(m).toMatchObject({ total: 3, executes: 2, passes: 1, echecs: 1, todo: 1, tauxReussite: 0.5, anomaliesBloquantes: 1, verdict: 'NO GO' });
    expect(m.exigences.map((e) => e.statut)).toEqual(['NON CONFORME', 'VALIDÉE']);
    expect(m.parSeverite.find((s) => s.severite === 'Mineure')).toEqual({ severite: 'Mineure', ouvertes: 0, fermees: 1 });
  });

  it('verdict GO quand tout réussit sans anomalie majeure ouverte', () => {
    const ok = new Map([
      ['SHOP-101', { status: 'PASSED', comments: [] }],
      ['SHOP-201', { status: 'PASSED', comments: [] }],
    ]);
    expect(campaignMetrics(ref, ok, [{ severite: 'Mineure', statut: 'Ouverte' }]).verdict).toBe('GO');
  });
});
