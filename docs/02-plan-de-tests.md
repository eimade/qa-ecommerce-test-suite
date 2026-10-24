# Plan de tests - campagne de régression ShopQA 1.0.0

| Élément | Valeur |
|---|---|
| Plan de test Xray | SHOP-100 |
| Version testée | 1.0.0 (boutique de démonstration `shop-demo/`) |
| Type de campagne | Régression complète automatisée + cas manuels |
| Environnement | Docker local (http://localhost:13100) ou CI (GitHub Actions / Azure DevOps) |
| Durée cible | < 5 minutes en CI |

## 1. Exigences testées

| Id | Exigence | Criticité |
|---|---|---|
| EX-CAT-01 | Afficher le catalogue (nom, prix, stock) | Haute |
| EX-CAT-02 | Filtrer par catégorie, rechercher par nom ou SKU | Moyenne |
| EX-CAT-03 | Un produit en rupture n'est pas commandable | Haute |
| EX-PAN-01 | Ajouter un article au panier (cumul sur une ligne) | Haute |
| EX-PAN-02 | Modifier la quantité ou retirer une ligne | Moyenne |
| EX-PAN-03 | Quantité entière de 1 à 10, limitée au stock | Haute |
| EX-PAN-04 | Livraison 4,90 EUR, offerte dès 50 EUR **après remise** | Haute |
| EX-PAN-05 | Codes promo BIENVENUE10 (-10 %, arrondi au centime inférieur) et LIVRAISON ; code inconnu refusé | Moyenne |
| EX-CMD-01 | Commande payée : confirmation, stock décrémenté, panier clôturé | Critique |
| EX-CMD-02 | Validation des données client (email, code postal 5 chiffres) et de la carte (Luhn) | Haute |
| EX-CMD-03 | Paiement refusé : aucune commande, panier et stock inchangés | Critique |
| EX-BO-01 | Backoffice protégé par jeton administrateur | Critique |
| EX-BO-02 | Cycle de vie des commandes ; annulation = remise en stock | Haute |
| EX-NF-01 | Catalogue : p99 < 250 ms, débit >= 300 req/s, 0 erreur sous 25 connexions | Moyenne |
| EX-NF-02 | Erreurs API au format `{ error: { code, message, details } }` | Moyenne |

La correspondance détaillée exigences <-> cas est dans [03-matrice-tracabilite.md](03-matrice-tracabilite.md).

## 2. Organisation de la campagne

| Ordre | Lot | Outil | Cas | Commande |
|---|---|---|---|---|
| 0 | Prérequis : build + unitaires + intégration | Vitest | 39 tests | `npm run test:unit` |
| 1 | Smoke (go / no go rapide) | Playwright | SHOP-201, SHOP-203 | `npm run test:e2e:smoke` |
| 2 | API | Newman | SHOP-101 à SHOP-115 | `npm run test:api` |
| 3 | UI régression | Playwright | SHOP-201 à SHOP-209 | `npm run test:e2e` |
| 4 | Performance | autocannon | SHOP-301 | `npm run test:perf` |
| 5 | Manuels | Testeur | SHOP-401, SHOP-402 | Exécution dans Xray |
| 6 | Restitution | scripts | - | `npm run xray:results` puis `npm run report` |

## 3. Rôles (équipe agile SAFe)

| Rôle | Responsabilité dans la campagne |
|---|---|
| QA (auteur du plan) | Conception des cas, automatisation, analyse des échecs, rapport, décision GO / NO GO proposée |
| Développeurs | Tests unitaires et d'intégration, correction des anomalies |
| Product Owner | Priorisation des anomalies, arbitrage des comportements ambigus (ex. ANO-001) |
| RTE / Scrum Master | Suivi des métriques au niveau du train (System Demo, Inspect & Adapt) |

## 4. Critères

- **Suspension** : environnement indisponible, ou plus de 20 % des cas smoke en échec : la campagne est arrêtée et une anomalie Bloquante est ouverte.
- **Reprise** : correctif livré et smoke vert.
- **Sortie** : voir la stratégie (§ 6) ; calcul automatique dans le rapport de campagne.

## 5. Livrables

- Rapport HTML Newman (`reports/newman/rapport-newman.html`), rapport HTML Playwright (`reports/playwright/html`), JUnit pour Azure DevOps.
- Exécution Xray (`reports/xray/execution-xray.json`).
- Rapport de campagne (`reports/rapport-campagne.md` ; instantané versionné : [07-rapport-campagne.md](07-rapport-campagne.md)).
