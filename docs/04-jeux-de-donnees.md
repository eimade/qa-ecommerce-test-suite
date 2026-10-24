# Jeux de données de test

Toutes les données sont **fictives**. Le catalogue de référence est défini dans `shop-demo/src/domain/seed.ts` et restauré avant chaque test (`POST /api/test/reset`, recette uniquement). Les adresses email utilisent le domaine réservé `example.com`.

## JDD-CAT-01 : catalogue de référence (8 produits)

| Id | SKU | Produit | Catégorie | Prix | Stock | Intérêt pour les tests |
|---|---|---|---|---|---|---|
| p-001 | TSH-BIO-M | T-shirt coton bio | vetements | 19,90 | 50 | Produit standard, cumul de quantités |
| p-002 | SWT-CAP-L | Sweat à capuche | vetements | 45,00 | 20 | Parcours d'achat, remise sur montant rond |
| p-003 | CAS-LAI-01 | Casquette en laine | vetements | 24,00 | **0** | Rupture de stock |
| p-004 | MUG-CER-35 | Mug céramique 35 cl | maison | 12,50 | 100 | Recherche, bornes de quantité |
| p-005 | LAM-BUR-LED | Lampe de bureau LED | maison | 39,90 | **2** | Stock limité (valeur limite), achat concurrent |
| p-006 | PLD-LIN-130 | Plaid en lin | maison | 59,00 | 15 | Au-dessus du seuil de livraison même après remise |
| p-007 | CAS-BT-NC | Casque Bluetooth | high-tech | 89,00 | 10 | Backoffice, annulation et remise en stock |
| p-008 | CHG-USB-C65 | Chargeur USB-C 65 W | high-tech | 29,90 | 40 | Recherche plein texte |

## JDD-PAN : quantités

| Id | Valeurs | Attendu |
|---|---|---|
| JDD-PAN-01 | 1, 2 (lampe, stock 2) | Accepté |
| JDD-PAN-01 | 3 (lampe, stock 2) | 409 OUT_OF_STOCK, `available: 2` |
| JDD-PAN-02 | 0, 11, 1.5, "2" | 400 VALIDATION_ERROR |

## JDD-PRO-01 : codes promo

| Code | Effet | Cas limites |
|---|---|---|
| BIENVENUE10 | -10 % sur le sous-total, arrondi au centime inférieur | 19,95 EUR -> remise 1,99 ; 54,00 EUR -> 48,60 donc livraison payante |
| LIVRAISON | Frais de port offerts | Insensible à la casse |
| NOEL99, CODEFAUX | Inconnus | 422 PROMO_INVALID |

## JDD-CLI : clients

| Id | Nom | Email | Code postal | Attendu |
|---|---|---|---|---|
| JDD-CLI-01 | Client Recette | client.recette@example.com | 75011 | Valide |
| JDD-CLI-02 | Client Recette | client-sans-arobase | 75011 | 400 sur email |
| JDD-CLI-02 | Client Recette | client.recette@example.com | 750 | 400 sur postalCode |

## JDD-PAY : cartes (bouchon de paiement)

| Id | Numéro | Attendu |
|---|---|---|
| JDD-PAY-01 | 4242 4242 4242 4242 | Paiement accepté, référence PAY-000001 |
| JDD-PAY-02 | 4000 0000 0000 0002 | 402 PAYMENT_DECLINED, « fonds insuffisants » |
| JDD-PAY-03 | 4242 4242 4242 4241, 1234 5678 9012 3456 | 400 : numéro non conforme Luhn |

## JDD-ADM-01 : backoffice

| Donnée | Valeur |
|---|---|
| Jeton administrateur | variable `ADMIN_TOKEN` (démo : `demo-admin-token-local`, CI : `demo-admin-token-ci`) |
| Jeton invalide | `jeton-incorrect` -> 401 |

## Montants de référence des parcours automatisés

| Cas | Panier | Sous-total | Remise | Livraison | Total |
|---|---|---|---|---|---|
| SHOP-105 | p-001 x2 | 39,80 | 0 | 4,90 | 44,70 |
| SHOP-108/109 | p-001 x1 + BIENVENUE10 | 19,90 | 1,99 | 4,90 | 22,81 |
| SHOP-201 | p-002 x1 + p-004 x2 | 70,00 | 0 | offerte | 70,00 |
| SHOP-205 | p-006 x1 + BIENVENUE10 | 59,00 | 5,90 | offerte | 53,10 |
