import { CARTE_ACCEPTEE, CARTE_REFUSEE, expect, test } from './fixtures';

test.describe('Parcours d achat', () => {
  test('SHOP-201 Achat complet avec carte acceptée @smoke @regression', async ({ shop, page }) => {
    await shop.openCatalogue();
    await shop.addToCart('p-002', 1);
    await shop.addToCart('p-004', 2);
    await expect(shop.tid('cart-count')).toHaveText('3');

    await shop.openCart();
    // 45,00 + 2 x 12,50 = 70,00 EUR : livraison offerte au-delà de 50 EUR
    await expect(shop.tid('subtotal')).toHaveText(/70,00/);
    await expect(shop.tid('shipping')).toHaveText('Offerte');
    await shop.tid('go-checkout').click();

    await expect(shop.tid('checkout-total')).toHaveText(/70,00/);
    await shop.fillCheckout(CARTE_ACCEPTEE);

    await expect(shop.tid('confirmation')).toBeVisible();
    await expect(shop.tid('order-id')).toHaveText(/^CMD-\d{5}$/);
    await expect(shop.tid('order-total')).toHaveText(/70,00/);
    await expect(shop.tid('cart-count')).toHaveText('0');

    // Effet de bord attendu : stock décrémenté dans le catalogue
    await page.goto('/');
    await expect(shop.product('p-002').getByTestId('stock')).toHaveText('En stock : 19');
  });

  test('SHOP-206 Paiement refusé : message affiché et panier conservé @regression', async ({ shop }) => {
    await shop.openCatalogue();
    await shop.addToCart('p-001', 1);
    await shop.page.goto('/commande');
    await shop.fillCheckout(CARTE_REFUSEE);

    await expect(shop.tid('message')).toHaveText('Paiement refusé : fonds insuffisants');
    await expect(shop.tid('confirmation')).toBeHidden();
    await expect(shop.tid('cart-count')).toHaveText('1');
  });

  test('SHOP-207 Formulaire de commande invalide @regression', async ({ shop }) => {
    await shop.openCatalogue();
    await shop.addToCart('p-001', 1);
    await shop.page.goto('/commande');

    await shop.fillCheckout(CARTE_ACCEPTEE, { email: 'client-sans-arobase' });
    await expect(shop.tid('message')).toHaveText('Adresse email invalide');

    await shop.fillCheckout(CARTE_ACCEPTEE, { postalCode: '750' });
    await expect(shop.tid('message')).toHaveText('Code postal invalide (5 chiffres)');

    await shop.fillCheckout('1234 5678 9012 3456');
    await expect(shop.tid('message')).toHaveText('Numéro de carte invalide');
    await expect(shop.tid('confirmation')).toBeHidden();
  });
});
