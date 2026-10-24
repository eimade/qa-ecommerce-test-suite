# Definition of Done et rituels qualité (SAFe)

La qualité est intégrée au flux (principe SAFe *Built-in Quality*) : une story n'est « terminée » que si ses preuves de test existent et sont vertes dans le pipeline.

## Definition of Done - User Story

- [ ] Critères d'acceptation rédigés au format Given / When / Then et revus en affinage (« Three Amigos » : PO, dev, QA)
- [ ] Exigence ajoutée ou mise à jour dans `xray/referentiel-tests.json`, au moins un cas de test lié
- [ ] Tests unitaires des règles métier (valeurs limites incluses), tests d'intégration API si nouvelle route
- [ ] Cas API (Postman) et/ou UI (Playwright) automatisés, clé Xray dans le nom du test
- [ ] Pipeline vert : build, typage, unitaires, Newman, Playwright, performance, cohérence du référentiel
- [ ] Matrice de traçabilité régénérée (`npm run xray:cases`) et commitée
- [ ] Aucune anomalie Bloquante ou Majeure ouverte sur la story
- [ ] Revue de code effectuée, pas de secret ni de donnée personnelle réelle dans le dépôt
- [ ] Démontrée au PO et acceptée

## Definition of Done - Feature (fin de PI)

- [ ] Toutes les stories de la feature « Done »
- [ ] Campagne de régression complète verte et rapport de campagne publié (verdict GO)
- [ ] Cas manuels associés exécutés (accessibilité, affichage mobile)
- [ ] Exigences non fonctionnelles vérifiées (performance EX-NF-01)
- [ ] Démontrée en System Demo

## Place de la QA dans les rituels

| Rituel SAFe | Contribution QA | Livrable de ce dépôt |
|---|---|---|
| PI Planning | Estimation de l'effort de test, identification des risques et dépendances (PSP, ERP) | Stratégie de tests |
| Affinage du backlog | Critères d'acceptation testables, jeux de données | Jeux de données, référentiel |
| Itération (daily) | Automatisation en parallèle du développement, remontée des anomalies | Postman, Playwright, registre d'anomalies |
| Revue d'itération / System Demo | Présentation du rapport de campagne et des métriques | Rapport de campagne |
| Inspect & Adapt | Analyse des tendances (taux de réussite, défauts par sévérité, tests instables) | Métriques du rapport, commentaires Xray « instable » |

## Métriques suivies

| Métrique | Calcul | Cible |
|---|---|---|
| Taux de réussite | cas réussis / cas exécutés | 100 % pour livrer |
| Couverture des exigences | exigences avec au moins un cas exécuté et aucun échec / total | 100 % |
| Taux d'automatisation | cas automatisés / total des cas | > 80 % (ici 24 / 26) |
| Défauts ouverts par sévérité | registre d'anomalies | 0 Bloquante, 0 Majeure |
| Durée de la campagne CI | temps du job « campagne » | < 5 min |
