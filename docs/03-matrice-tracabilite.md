# Matrice de traçabilité exigences <-> cas de test

> Document généré par `npm run xray:cases` depuis `xray/referentiel-tests.json` (source unique). Ne pas éditer à la main.

Plan de test : **SHOP-100**. 15 exigences, 27 cas de test (25 automatisés, 2 manuels).

## Couverture par exigence

| Exigence | Module | Criticité | Libellé | Cas API | Cas UI | Autres |
|---|---|---|---|---|---|---|
| EX-CAT-01 | catalogue | Haute | Afficher le catalogue (nom, prix TTC, stock) | SHOP-101 | SHOP-202 | SHOP-402 |
| EX-CAT-02 | catalogue | Moyenne | Filtrer par catégorie et rechercher par nom ou SKU | SHOP-102, SHOP-103 | SHOP-202 | - |
| EX-CAT-03 | catalogue | Haute | Un produit en rupture n'est pas commandable | SHOP-106 | SHOP-203 | - |
| EX-PAN-01 | panier | Haute | Ajouter un article au panier (cumul sur une ligne) | SHOP-105 | SHOP-201 | - |
| EX-PAN-02 | panier | Moyenne | Modifier la quantité ou retirer une ligne | SHOP-115 | SHOP-204 | - |
| EX-PAN-03 | panier | Haute | Quantité entière de 1 à 10 et limitée au stock | SHOP-106, SHOP-107 | SHOP-204 | - |
| EX-PAN-04 | panier | Haute | Livraison 4,90 EUR, offerte dès 50 EUR après remise | SHOP-105, SHOP-108 | SHOP-201, SHOP-205 | - |
| EX-PAN-05 | panier | Moyenne | Codes promo BIENVENUE10 et LIVRAISON, code inconnu refusé | SHOP-108 | SHOP-205 | - |
| EX-CMD-01 | checkout | Critique | Commande payée : confirmation, stock décrémenté, panier clôturé | SHOP-109 | SHOP-201 | SHOP-401 |
| EX-CMD-02 | checkout | Haute | Validation des données client et du numéro de carte | SHOP-110 | SHOP-207, SHOP-209 | - |
| EX-CMD-03 | checkout | Critique | Paiement refusé : aucune commande, panier conservé | SHOP-111 | SHOP-206 | - |
| EX-BO-01 | backoffice | Critique | Backoffice accessible uniquement avec un jeton administrateur | SHOP-112 | SHOP-208 | - |
| EX-BO-02 | backoffice | Haute | Cycle de vie des commandes (PAYEE, EXPEDIEE, LIVREE, ANNULEE) | SHOP-113 | SHOP-208 | - |
| EX-NF-01 | performance | Moyenne | Catalogue : p99 < 250 ms et 0 erreur sous 25 connexions | - | - | SHOP-301 |
| EX-NF-02 | robustesse | Moyenne | Erreurs API au format stable { error: { code, message } } | SHOP-102, SHOP-104, SHOP-114 | - | - |

## Liste des cas de test

| Clé | Titre | Type | Outil | Priorité | Exigences | Jeux de données |
|---|---|---|---|---|---|---|
| SHOP-101 | Lister le catalogue et vérifier le contrat de données | Automatisé | Postman/Newman | Haute | EX-CAT-01 | JDD-CAT-01 |
| SHOP-102 | Filtrer par catégorie (valide et inconnue) | Automatisé | Postman/Newman | Moyenne | EX-CAT-02, EX-NF-02 | JDD-CAT-01 |
| SHOP-103 | Rechercher un produit (insensible à la casse) | Automatisé | Postman/Newman | Moyenne | EX-CAT-02 | JDD-CAT-01 |
| SHOP-104 | Consulter un produit inexistant | Automatisé | Postman/Newman | Basse | EX-NF-02 | - |
| SHOP-105 | Créer un panier, ajouter et cumuler un article | Automatisé | Postman/Newman | Haute | EX-PAN-01, EX-PAN-04 | JDD-CAT-01 |
| SHOP-106 | Refuser un produit en rupture ou une quantité supérieure au stock | Automatisé | Postman/Newman | Haute | EX-CAT-03, EX-PAN-03 | JDD-CAT-01 |
| SHOP-107 | Quantités hors bornes (0 et 11) | Automatisé | Postman/Newman | Moyenne | EX-PAN-03 | JDD-PAN-02 |
| SHOP-108 | Appliquer un code promo inconnu puis BIENVENUE10 | Automatisé | Postman/Newman | Moyenne | EX-PAN-05, EX-PAN-04 | JDD-PRO-01 |
| SHOP-109 | Passer une commande valide | Automatisé | Postman/Newman | Critique | EX-CMD-01 | JDD-CLI-01, JDD-PAY-01 |
| SHOP-110 | Refuser des données client ou une carte invalides | Automatisé | Postman/Newman | Haute | EX-CMD-02 | JDD-CLI-02, JDD-PAY-03 |
| SHOP-111 | Paiement refusé par le prestataire | Automatisé | Postman/Newman | Critique | EX-CMD-03 | JDD-PAY-02 |
| SHOP-112 | Contrôle d'accès du backoffice | Automatisé | Postman/Newman | Critique | EX-BO-01 | JDD-ADM-01 |
| SHOP-113 | Transitions de statut de commande | Automatisé | Postman/Newman | Haute | EX-BO-02 | JDD-ADM-01 |
| SHOP-114 | Robustesse : JSON malformé et route inconnue | Automatisé | Postman/Newman | Basse | EX-NF-02 | - |
| SHOP-115 | Modifier la quantité et retirer une ligne via l'API | Automatisé | Postman/Newman | Moyenne | EX-PAN-02 | JDD-CAT-01 |
| SHOP-201 | Parcours d'achat complet avec carte acceptée (UI) | Automatisé | Playwright | Critique | EX-CMD-01, EX-PAN-01, EX-PAN-04 | JDD-CLI-01, JDD-PAY-01 |
| SHOP-202 | Filtrer et rechercher dans le catalogue (UI) | Automatisé | Playwright | Moyenne | EX-CAT-01, EX-CAT-02 | JDD-CAT-01 |
| SHOP-203 | Produit en rupture non commandable (UI) | Automatisé | Playwright | Haute | EX-CAT-03 | JDD-CAT-01 |
| SHOP-204 | Modifier, dépasser le stock et retirer une ligne (UI) | Automatisé | Playwright | Moyenne | EX-PAN-02, EX-PAN-03 | JDD-PAN-01 |
| SHOP-205 | Seuil de livraison gratuite et code promo (UI) | Automatisé | Playwright | Haute | EX-PAN-04, EX-PAN-05 | JDD-PRO-01 |
| SHOP-206 | Paiement refusé : message et panier conservé (UI) | Automatisé | Playwright | Critique | EX-CMD-03 | JDD-PAY-02 |
| SHOP-207 | Formulaire de commande invalide (UI) | Automatisé | Playwright | Haute | EX-CMD-02 | JDD-CLI-02, JDD-PAY-03 |
| SHOP-208 | Expédier puis livrer une commande depuis le backoffice (UI) | Automatisé | Playwright | Haute | EX-BO-01, EX-BO-02 | JDD-ADM-01 |
| SHOP-209 | Bouton Payer inactif tant que la page de commande n'est pas prête (UI) | Automatisé | Playwright | Haute | EX-CMD-02 | JDD-CAT-01 |
| SHOP-301 | Charge légère du catalogue | Automatisé | autocannon | Moyenne | EX-NF-01 | JDD-CAT-01 |
| SHOP-401 | Parcours d'achat au clavier uniquement (accessibilité) | Manuel | Manuel | Moyenne | EX-CMD-01 | JDD-CLI-01, JDD-PAY-01 |
| SHOP-402 | Affichage du catalogue et du panier sur mobile (375 px) | Manuel | Manuel | Basse | EX-CAT-01 | JDD-CAT-01 |
