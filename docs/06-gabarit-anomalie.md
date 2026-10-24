# Gabarit de fiche d'anomalie

Équivalent d'un ticket **Bug** JIRA lié à une exécution de test Xray. Chaque anomalie est aussi enregistrée dans `xray/anomalies.json` (source des métriques du rapport de campagne).

```markdown
## ANO-XXX - <Titre court : quoi + où, ex. « Total erroné après code promo sur le panier »>

| Champ | Valeur |
|---|---|
| Sévérité | Bloquante / Majeure / Mineure / Cosmétique |
| Priorité | Haute / Moyenne / Basse (décidée par le PO) |
| Statut | Ouverte / En cours / Corrigée / Fermée / Réouverte / Rejetée |
| Exigence | EX-... |
| Cas de test | SHOP-... (exécution Xray : ...) |
| Version / environnement | 1.0.0 - local Docker / CI (lien du run) |
| Jeu de données | JDD-... |
| Détectée le / par | AAAA-MM-JJ / rôle |

### Étapes de reproduction
1. ...
2. ...

### Résultat attendu
...

### Résultat obtenu
...

### Preuves
Capture, trace Playwright (`reports/playwright/html`), extrait du rapport Newman, requête / réponse HTTP.

### Analyse et impact
Fréquence, contournement possible, impact client ou financier.
```

## Échelle de sévérité

| Sévérité | Définition | Exemple e-commerce |
|---|---|---|
| Bloquante | Empêche un parcours critique, aucun contournement | Impossible de payer |
| Majeure | Fonction importante incorrecte, impact financier ou contournement coûteux | Remise appliquée deux fois |
| Mineure | Fonction secondaire incorrecte, contournement simple | Recherche trop large |
| Cosmétique | Libellé, alignement, sans impact fonctionnel | Faute dans un message |

## Exemple réel de la campagne

## ANO-001 - La recherche « casque » remonte aussi « Casquette en laine »

| Champ | Valeur |
|---|---|
| Sévérité | Mineure |
| Priorité | Basse |
| Statut | Ouverte (à arbitrer par le PO) |
| Exigence | EX-CAT-02 |
| Cas de test | SHOP-103 |
| Version / environnement | 1.0.0 - local |
| Jeu de données | JDD-CAT-01 |

**Étapes** : ouvrir le catalogue, saisir « casque », cliquer sur Filtrer.
**Attendu** : seul « Casque Bluetooth » est proposé.
**Obtenu** : « Casquette en laine » et « Casque Bluetooth » : la recherche porte sur une sous-chaîne.
**Analyse** : détectée lors de la conception des tests unitaires du catalogue. Le besoin (mot entier, préfixe de mot) n'est pas précisé dans l'exigence : question posée au PO. En attendant, SHOP-103 utilise un terme non ambigu.
