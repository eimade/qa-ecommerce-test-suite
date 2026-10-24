# Correspondance avec SAP Commerce Cloud (Hybris)

SAP Commerce (ex-Hybris) est un progiciel sous licence, inaccessible pour ce projet. La boutique de démonstration reproduit volontairement le **découpage fonctionnel** d'un storefront SAP Commerce afin que la démarche de test (cas, jeux de données, automatisation) soit transposable. Cette note indique, pour chaque scénario testé, le module SAP Commerce concerné et ce qu'il faudrait adapter sur un vrai projet.

## Correspondance des modules

| Domaine ShopQA | Module / concept SAP Commerce | Cas ShopQA | Adaptation sur un projet SAP Commerce |
|---|---|---|---|
| Catalogue (`GET /products`, filtres, recherche) | Product Catalog (catalogue *Staged* / *Online*, synchronisation), Solr Facet Search | SHOP-101 à SHOP-104, SHOP-202 | Tester sur la version *Online* après synchronisation ; ajouter des cas sur l'indexation Solr (produit visible après indexation) et les facettes |
| Rupture de stock | Stock Service, Warehouse, *StockLevel* | SHOP-106, SHOP-203 | Jeux de données par entrepôt et point de service ; statut *forceInStock* |
| Panier (ajout, cumul, quantités) | Cart Service, *CartModificationStatus* (ex. `lowStock`, `noStock`) | SHOP-105, SHOP-107, SHOP-115, SHOP-204 | Vérifier les statuts de modification renvoyés par l'OCC API |
| Calcul des totaux, frais de port | Calculation Service, Delivery Modes | SHOP-105, SHOP-201 | Seuils de gratuité configurés par mode de livraison et par site |
| Codes promo | Promotion Engine (Rule Builder, *Coupons*) | SHOP-108, SHOP-205 | Tester l'activation / publication des règles ; table de décision combinant plusieurs promotions |
| Tunnel de commande | Checkout Flow (adresse, mode de livraison, paiement), *placeOrder* | SHOP-109, SHOP-110, SHOP-201, SHOP-207 | Étapes supplémentaires : choix du mode de livraison, compte client ou invité |
| Paiement | Payment Integration (extension PSP, ex. Adyen, Stripe), *PaymentTransaction* | SHOP-111, SHOP-206 | Remplacer le bouchon par les cartes de test du PSP en sandbox ; cas 3-D Secure |
| Backoffice commandes | Backoffice / Customer Support Cockpit, Order Management (OMS), Order Process (Business Process) | SHOP-112, SHOP-113, SHOP-208 | Statuts réels (*CREATED*, *PAYMENT_CAPTURED*, *SHIPPED*...) ; tests des Business Processes |
| Contrôle d'accès | User Groups, Backoffice roles, OAuth2 OCC | SHOP-112 | Jetons OAuth2 client / utilisateur pour l'OCC API |
| Performance catalogue | Storefront / OCC API, cache | SHOP-301 | Profil de charge sur les pages catégorie et la recherche Solr, avec le jeu de données de production anonymisé |

## API de test

Sur SAP Commerce, la collection Postman viserait l'**OCC REST API** (`/occ/v2/{baseSiteId}/products/search`, `/users/{userId}/carts`, `/orders`). La structure de la collection (dossiers par domaine, variables d'environnement `baseUrl`, jetons, identifiants de panier chaînés) est identique ; seuls les chemins et les schémas de réponse changent.

## Données

Les jeux de données SAP Commerce sont habituellement chargés par **ImpEx**. Le jeu JDD-CAT-01 se traduirait par un fichier ImpEx (produits, prix, niveaux de stock) importé dans un environnement de recette, à la place de la route `POST /api/test/reset`.

## Ce que ce projet ne prouve pas

Aucune manipulation réelle de SAP Commerce (Backoffice, HAC, ImpEx, Solr) n'a été réalisée. Le projet démontre la méthode de test d'un site e-commerce découpé comme SAP Commerce, pas une expérience du progiciel.
