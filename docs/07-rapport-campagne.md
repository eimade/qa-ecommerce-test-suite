# Rapport de campagne de tests - Uimad QA 1.0.0

> Généré le 2026-10-24 par `npm run report` à partir des rapports Newman, Playwright, autocannon et Vitest de l'exécution.

Environnement : Docker Desktop sous Windows, boutique conteneurisée (port 13100)

## Synthèse

- **Verdict : GO** (critère de sortie : 100 % des cas critiques et hauts réussis, aucune anomalie bloquante ou majeure ouverte)
- Cas exécutés : 25 / 27 (92.6 %) ; non exécutés : 2 (cas manuels hors CI)
- Taux de réussite des cas exécutés : **100.0 %** (25 réussis, 0 en échec)
- Exigences validées : 15 / 15 (100.0 %)
- Anomalies ouvertes : 1 (bloquantes ou majeures : 0)

## Résultats par outil

| Niveau | Outil | Cas | Réussis | Échecs | Détail |
|---|---|---|---|---|---|
| API | Postman/Newman | 15 | 15 | 0 | 0 non exécuté(s) |
| UI (E2E) | Playwright | 9 | 9 | 0 | 0 non exécuté(s) |
| Performance | autocannon | 1 | 1 | 0 | 0 non exécuté(s) |
| Manuel | Manuel | 2 | 0 | 0 | 2 non exécuté(s) |
| Développement | Vitest (unitaires + intégration API) | 39 tests | 39 | 0 | hors référentiel Xray |
| | Newman (assertions) | 97 assertions | 97 | 0 | 31 requêtes |

## Performance (SHOP-301)

| Requêtes | Débit moyen | Latence p50 | p90 | p99 (seuil 250 ms) | Erreurs | Statut |
|---|---|---|---|---|---|---|
| 3508 | 350.8 req/s | 61 ms | 117 ms | 201 ms | 0 | PASSED |

## Couverture des exigences

| Exigence | Criticité | Cas | Statut |
|---|---|---|---|
| EX-CAT-01 Afficher le catalogue (nom, prix TTC, stock) | Haute | SHOP-101, SHOP-202, SHOP-402 | VALIDÉE |
| EX-CAT-02 Filtrer par catégorie et rechercher par nom ou SKU | Moyenne | SHOP-102, SHOP-103, SHOP-202 | VALIDÉE |
| EX-CAT-03 Un produit en rupture n'est pas commandable | Haute | SHOP-106, SHOP-203 | VALIDÉE |
| EX-PAN-01 Ajouter un article au panier (cumul sur une ligne) | Haute | SHOP-105, SHOP-201 | VALIDÉE |
| EX-PAN-02 Modifier la quantité ou retirer une ligne | Moyenne | SHOP-115, SHOP-204 | VALIDÉE |
| EX-PAN-03 Quantité entière de 1 à 10 et limitée au stock | Haute | SHOP-106, SHOP-107, SHOP-204 | VALIDÉE |
| EX-PAN-04 Livraison 4,90 EUR, offerte dès 50 EUR après remise | Haute | SHOP-105, SHOP-108, SHOP-201, SHOP-205 | VALIDÉE |
| EX-PAN-05 Codes promo BIENVENUE10 et LIVRAISON, code inconnu refusé | Moyenne | SHOP-108, SHOP-205 | VALIDÉE |
| EX-CMD-01 Commande payée : confirmation, stock décrémenté, panier clôturé | Critique | SHOP-109, SHOP-201, SHOP-401 | VALIDÉE |
| EX-CMD-02 Validation des données client et du numéro de carte | Haute | SHOP-110, SHOP-207, SHOP-209 | VALIDÉE |
| EX-CMD-03 Paiement refusé : aucune commande, panier conservé | Critique | SHOP-111, SHOP-206 | VALIDÉE |
| EX-BO-01 Backoffice accessible uniquement avec un jeton administrateur | Critique | SHOP-112, SHOP-208 | VALIDÉE |
| EX-BO-02 Cycle de vie des commandes (PAYEE, EXPEDIEE, LIVREE, ANNULEE) | Haute | SHOP-113, SHOP-208 | VALIDÉE |
| EX-NF-01 Catalogue : p99 < 250 ms et 0 erreur sous 25 connexions | Moyenne | SHOP-301 | VALIDÉE |
| EX-NF-02 Erreurs API au format stable { error: { code, message } } | Moyenne | SHOP-102, SHOP-104, SHOP-114 | VALIDÉE |

## Cas en échec ou non exécutés

- SHOP-401 Parcours d'achat au clavier uniquement (accessibilité) : **TODO** - cas manuel
- SHOP-402 Affichage du catalogue et du panier sur mobile (375 px) : **TODO** - cas manuel

## Anomalies par sévérité

| Sévérité | Ouvertes | Corrigées / fermées |
|---|---|---|
| Bloquante | 0 | 0 |
| Majeure | 0 | 1 |
| Mineure | 1 | 0 |
| Cosmétique | 0 | 0 |

- ANO-001 (Mineure, Ouverte) : La recherche « casque » remonte aussi « Casquette en laine » - cas SHOP-103, exigence EX-CAT-02
- ANO-002 (Majeure, Fermée) : Clic sur Payer avant la fin du chargement : soumission native, numéro de carte exposé dans l'URL - cas SHOP-207, exigence EX-CMD-02

## Recommandation

Livraison recommandée. Les cas manuels (accessibilité clavier, affichage mobile) restent à exécuter avant la mise en production ; l anomalie mineure ouverte est à arbitrer par le PO au prochain PI planning ou affinage.
