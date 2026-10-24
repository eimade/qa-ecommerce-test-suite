import { test as base, expect, type Page } from '@playwright/test';

export const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? 'demo-admin-token-local';

/** Jeu de données client JDD-CLI-01 (docs/04-jeux-de-donnees.md). */
export const CLIENT = {
  name: 'Client Recette',
  email: 'client.recette@example.com',
  address: '12 rue de la Recette',
  postalCode: '75011',
  city: 'Paris',
};

export const CARTE_ACCEPTEE = '4242 4242 4242 4242';
export const CARTE_REFUSEE = '4000 0000 0000 0002';

/** Chaque test repart d'un état connu : données de référence restaurées via l'API de test. */
export const test = base.extend<{ shop: ShopPage }>({
  shop: async ({ page, request }, use) => {
    const res = await request.post('/api/test/reset');
    expect(res.status()).toBe(204);
    await use(new ShopPage(page));
  },
});

export { expect };

/** Page Object minimal : centralise les sélecteurs data-testid du parcours d'achat. */
export class ShopPage {
  constructor(readonly page: Page) {}

  tid(id: string) {
    return this.page.getByTestId(id);
  }

  async openCatalogue() {
    await this.page.goto('/');
    await expect(this.tid('product-list').locator('article').first()).toBeVisible();
  }

  product(id: string) {
    return this.tid(`product-${id}`);
  }

  async addToCart(productId: string, quantity = 1) {
    const card = this.product(productId);
    await card.getByTestId('qty-input').fill(String(quantity));
    await card.getByTestId('add-to-cart').click();
    await expect(this.tid('message')).toContainText('ajouté au panier');
  }

  async openCart() {
    await this.tid('cart-link').click();
    await expect(this.page).toHaveURL(/\/panier$/);
  }

  async fillCheckout(card: string, overrides: Partial<typeof CLIENT> = {}) {
    const data = { ...CLIENT, ...overrides };
    for (const [field, value] of Object.entries(data)) await this.tid(field).fill(value);
    await this.tid('cardNumber').fill(card);
    await this.tid('pay').click();
  }
}
