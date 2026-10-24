# Stratégie de tests - Uimad QA

## 1. Contexte et objectifs

Une équipe e-commerce organisée en train SAFe livre à chaque itération des évolutions du catalogue, du panier, du tunnel de commande et du backoffice. La stratégie vise à :

- détecter au plus tôt les régressions sur le chiffre d'affaires (panier, paiement, commande) ;
- fournir à chaque livraison une décision **GO / NO GO** objective et tracée (exigence -> cas -> exécution -> anomalie) ;
- maintenir une campagne de régression **automatisée, rapide (< 5 min en CI) et reproductible**.

## 2. Périmètre

| Dans le périmètre | Hors périmètre (assumé) |
|---|---|
| Catalogue : liste, filtres, recherche, rupture de stock | Moteur de recherche avancé (Solr), i18n, multi-devises |
| Panier : ajout, cumul, quantités, stock, frais de port, codes promo | Promotions complexes (règles combinées, fidélité) |
| Commande : validation client, carte (Luhn), paiement accepté / refusé | PSP réel 3-D Secure (bouchon de paiement) |
| Backoffice : accès par jeton, cycle de vie des commandes | Gestion des rôles fins, SSO |
| Non fonctionnel : temps de réponse catalogue, format des erreurs | Sécurité approfondie (pentest), charge de type « soldes » |

## 3. Approche par niveaux (pyramide)

| Niveau | Outil | Ce qui est vérifié | Qui / quand |
|---|---|---|---|
| Unitaire | Vitest | Règles de calcul (remise, seuil de livraison), validations, transitions de statut | Développeur, à chaque commit |
| Intégration API | Vitest + Supertest | Routes HTTP, codes d'erreur, contrôle d'accès | Développeur, à chaque commit |
| Système API | Postman / Newman | Contrat et règles métier de bout en bout sur l'application démarrée | QA, CI à chaque PR, rapport HTML |
| Système UI (E2E) | Playwright | Parcours d'achat et régression vue utilisateur | QA, CI à chaque PR, rapport HTML + traces |
| Performance | autocannon | Latence p99 et débit du catalogue, absence d'erreur | QA, CI à chaque PR (charge légère) |
| Manuel / exploratoire | Xray (cas manuels) | Accessibilité clavier, affichage mobile, exploration | QA, avant mise en production |

Principe : chaque règle est testée **au niveau le plus bas possible** (les valeurs limites de calcul en unitaire), puis seulement le **parcours** au niveau UI. Les tests UI ne revérifient pas toutes les combinaisons, ils prouvent l'intégration front / API.

## 4. Techniques de conception

- **Partitions d'équivalence et valeurs limites** : quantités 0 / 1 / 10 / 11, seuil de livraison 49,99 / 50,00 EUR, stock limité (2 unités).
- **Tables de décision** : remise x seuil de livraison (le seuil est évalué après remise).
- **Transitions d'états** : PAYEE -> EXPEDIEE -> LIVREE, PAYEE -> ANNULEE ; transitions interdites testées.
- **Tests négatifs** : JSON malformé, catégorie inconnue, carte non conforme Luhn, paiement refusé, jeton absent.
- **Basée sur les risques** : priorité Critique pour le paiement et la création de commande (impact financier direct).

## 5. Données et environnements

- Jeu de données de référence versionné (docs/04-jeux-de-donnees.md), restauré avant chaque test par `POST /api/test/reset`, route **désactivée hors recette** (`ENABLE_TEST_RESET`).
- Environnements : poste local (Docker, port 13100), CI GitHub Actions, pipeline Azure DevOps équivalent.

## 6. Critères d'entrée et de sortie

- **Entrée** : build vert, tests unitaires verts, référentiel Xray cohérent (chaque exigence couverte, chaque cas automatisé implémenté).
- **Sortie (GO)** : 100 % des cas automatisés de priorité Critique et Haute réussis, aucun échec, aucune anomalie Bloquante ou Majeure ouverte. Les cas manuels non exécutés sont signalés dans le rapport.

## 7. Gestion des anomalies

Toute anomalie suit le gabarit docs/06-gabarit-anomalie.md, est liée à une exigence et à un cas de test, et classée par sévérité (Bloquante, Majeure, Mineure, Cosmétique). Le registre `xray/anomalies.json` alimente les métriques du rapport.

## 8. Outillage et traçabilité

`xray/referentiel-tests.json` est la **source unique** des exigences et des cas. Elle génère la matrice, les fichiers d'import Xray (JSON/CSV) et sert à convertir les résultats Newman / Playwright / autocannon au format d'exécution Xray. La CI échoue si la matrice n'est pas à jour ou si un cas automatisé déclaré n'existe pas dans le code de test.

## 9. Risques

| Risque | Parade |
|---|---|
| Tests E2E instables (flaky) | Sélecteurs `data-testid`, attentes web-first, données réinitialisées, 1 relance en CI signalée « instable » dans Xray |
| Dérive entre plan et automatisation | Contrôle automatique référentiel <-> code en CI |
| Faux sentiment de couverture | Cas manuels visibles en TODO dans le rapport, verdict explicite |
