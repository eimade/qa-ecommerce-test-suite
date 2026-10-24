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

## Anomalies réelles de la campagne

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

## ANO-002 - Clic sur Payer avant la fin du chargement : numéro de carte exposé dans l'URL

| Champ | Valeur |
|---|---|
| Sévérité | Majeure (donnée de paiement exposée dans l'historique du navigateur et les journaux serveur) |
| Priorité | Haute |
| Statut | Fermée (corrigée et vérifiée le jour de la détection) |
| Exigence | EX-CMD-02 |
| Cas de test | SHOP-207 (détection), SHOP-209 (non-régression) |
| Version / environnement | 1.0.0 - local, Chromium |
| Jeu de données | JDD-CLI-01, JDD-PAY-03 |

**Étapes** : ajouter un article, ouvrir `/commande`, remplir le formulaire et cliquer sur Payer avant la fin du chargement du panier.
**Attendu** : le paiement est traité par l'application, ou le bouton est inactif tant que la page n'est pas prête.
**Obtenu** : le formulaire part en soumission GET native, la page se recharge et tous les champs, dont le numéro de carte, apparaissent dans l'URL.
**Analyse** : repérée sur un échec intermittent de SHOP-207 (message d'erreur attendu jamais affiché). L'analyse a mis en évidence un rechargement complet de la page. Cause : le gestionnaire `submit` n'était attaché qu'après deux appels asynchrones. **Correctif** : gestionnaire attaché d'abord, bouton Payer désactivé jusqu'à ce que la page soit prête, `method="post"` en défense en profondeur. **Preuve de correction** : SHOP-207 vérifie que l'URL reste `/commande`, SHOP-209 ralentit l'API panier et vérifie l'état du bouton ; 27 exécutions sur 27 réussies avec `--repeat-each 3`.
