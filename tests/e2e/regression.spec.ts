import { ADMIN_TOKEN, CARTE_ACCEPTEE, expect, test } from './fixtures';

test.describe('Régression catalogue', () => {
  test('SHOP-202 Filtrer et rechercher dans le catalogue @regression', async ({ shop }) => {
    await shop.openCatalogue();
    await expect(shop.tid('result-count')).toHaveText('8 produit(s)');

    await shop.tid('category-filter').selectOption('maison');
    await shop.page.getByRole('button', { name: 'Filtrer' }).click();
    await expect(shop.tid('result-count')).toHaveText('3 produit(s)');

    await shop.tid('category-filter').selectOption('');
    await shop.tid('search-input').fill('chargeur');
    await shop.page.getByRole('button', { name: 'Filtrer' }).click();
    await expect(shop.tid('product-list').locator('article')).toHaveCount(1);
    await expect(shop.product('p-008')).toBeVisible();
  });

  test('SHOP-203 Produit en rupture non commandable @smoke @regression', async ({ shop }) => {
    await shop.openCatalogue();
    const card = shop.product('p-003');
    await expect(card.getByTestId('stock')).toHaveText('Indisponible');
    await expect(card.getByTestId('add-to-cart')).toBeDisabled();
    await expect(card.getByTestId('add-to-cart')).toHaveText('Rupture de stock');
  });
});

test.describe('Régression panier', () => {
  test('SHOP-204 Modifier, refuser au-delà du stock et retirer une ligne @regression', async ({ shop }) => {
    await shop.openCatalogue();
    await shop.addToCart('p-005', 1);
    await shop.addToCart('p-001', 1);
    await shop.openCart();

    const lampe = shop.tid('line-p-005');
    await lampe.getByTestId('line-qty').fill('2');
    await lampe.getByTestId('line-qty').dispatchEvent('change');
    await expect(lampe.getByTestId('line-total')).toHaveText(/79,80/);

    // Valeur limite : 3 unités alors que le stock est de 2
    await lampe.getByTestId('line-qty').fill('3');
    await lampe.getByTestId('line-qty').dispatchEvent('change');
    await expect(shop.tid('message')).toContainText('Stock insuffisant');
    await expect(lampe.getByTestId('line-qty')).toHaveValue('2');

    await shop.tid('line-p-001').getByTestId('remove-line').click();
    await expect(shop.tid('line-p-001')).toHaveCount(0);
    await expect(shop.tid('cart-count')).toHaveText('2');

    await lampe.getByTestId('remove-line').click();
    await expect(shop.tid('empty-cart')).toBeVisible();
  });

  test('SHOP-205 Seuil de livraison gratuite et code promo @regression', async ({ shop }) => {
    await shop.openCatalogue();
    await shop.addToCart('p-006', 1); // 59,00 EUR
    await shop.openCart();
    await expect(shop.tid('shipping')).toHaveText('Offerte');

    await shop.tid('promo-input').fill('CODEFAUX');
    await shop.page.getByRole('button', { name: 'Appliquer' }).click();
    await expect(shop.tid('message')).toHaveText('Code promo inconnu ou expiré');

    // 59,00 - 10 % = 53,10 EUR : reste au-dessus du seuil de 50 EUR
    await shop.tid('promo-input').fill('BIENVENUE10');
    await shop.page.getByRole('button', { name: 'Appliquer' }).click();
    await expect(shop.tid('message')).toHaveText('Code BIENVENUE10 appliqué');
    await expect(shop.tid('discount')).toHaveText(/5,90/);
    await expect(shop.tid('total')).toHaveText(/53,10/);
    await expect(shop.tid('shipping')).toHaveText('Offerte');
  });
});

test.describe('Régression backoffice', () => {
  test('SHOP-208 Expédier puis livrer une commande depuis le backoffice @regression', async ({ shop, page }) => {
    await shop.openCatalogue();
    await shop.addToCart('p-007', 1);
    await page.goto('/commande');
    await shop.fillCheckout(CARTE_ACCEPTEE);
    const orderId = (await shop.tid('order-id').textContent())!;

    await page.goto('/admin');
    await shop.tid('admin-token').fill('jeton-incorrect');
    await page.getByRole('button', { name: 'Charger les commandes' }).click();
    await expect(shop.tid('message')).toHaveText('Jeton administrateur manquant ou invalide');

    await shop.tid('admin-token').fill(ADMIN_TOKEN);
    await page.getByRole('button', { name: 'Charger les commandes' }).click();
    const row = shop.tid(`order-${orderId}`);
    await expect(row.getByTestId('status')).toHaveText('PAYEE');

    await row.getByTestId('to-EXPEDIEE').click();
    await expect(row.getByTestId('status')).toHaveText('EXPEDIEE');
    await expect(row.getByTestId('to-ANNULEE')).toHaveCount(0);
    await row.getByTestId('to-LIVREE').click();
    await expect(row.getByTestId('status')).toHaveText('LIVREE');
  });
});
