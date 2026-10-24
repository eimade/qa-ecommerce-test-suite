import { beforeEach, describe, expect, it } from 'vitest';
import { SimulatedPaymentGateway } from '../src/domain/payment.js';
import { ShopService } from '../src/domain/shop-service.js';

const customer = { name: 'Client Test', email: 'client@example.com', address: '1 rue des Tests', postalCode: '69001', city: 'Lyon' };
const OK_CARD = { cardNumber: '4242424242424242' };

describe('ShopService', () => {
  let shop: ShopService;
  beforeEach(() => {
    shop = new ShopService(new SimulatedPaymentGateway());
  });

  it('filtre le catalogue par catégorie et par recherche', () => {
    expect(shop.listProducts({ category: 'maison' })).toHaveLength(3);
    expect(shop.listProducts({ q: 'bluetooth' }).map((p) => p.id)).toEqual(['p-007']);
    expect(() => shop.listProducts({ category: 'jardin' })).toThrow(/Catégorie inconnue/);
  });

  it('cumule les quantités d un même produit dans une seule ligne', () => {
    const cart = shop.createCart();
    shop.addItem(cart.id, 'p-001', 2);
    const view = shop.addItem(cart.id, 'p-001', 3);
    expect(view.lines).toHaveLength(1);
    expect(view.lines[0].quantity).toBe(5);
  });

  it('refuse un produit en rupture et une quantité supérieure au stock', () => {
    const cart = shop.createCart();
    expect(() => shop.addItem(cart.id, 'p-003', 1)).toThrow(/Stock insuffisant/);
    expect(() => shop.addItem(cart.id, 'p-005', 3)).toThrow(/disponible : 2/);
  });

  it('crée la commande, décrémente le stock et supprime le panier', () => {
    const cart = shop.createCart();
    shop.addItem(cart.id, 'p-005', 2);
    const order = shop.checkout({ cartId: cart.id, customer, payment: OK_CARD });
    expect(order).toMatchObject({ id: 'CMD-00001', status: 'PAYEE', paymentReference: 'PAY-000001' });
    expect(order.totals.totalCents).toBe(7980);
    expect(shop.getProduct('p-005').stock).toBe(0);
    expect(() => shop.getCart(cart.id)).toThrow(/Panier introuvable/);
  });

  it('paiement refusé : aucune commande et stock inchangé', () => {
    const cart = shop.createCart();
    shop.addItem(cart.id, 'p-001', 1);
    expect(() => shop.checkout({ cartId: cart.id, customer, payment: { cardNumber: SimulatedPaymentGateway.DECLINED_CARD } }))
      .toThrow(/refusé/);
    expect(shop.getProduct('p-001').stock).toBe(50);
    expect(shop.listOrders()).toHaveLength(0);
    expect(shop.getCart(cart.id).lines).toHaveLength(1);
  });

  it('revérifie le stock au paiement (achat concurrent)', () => {
    const a = shop.createCart();
    const b = shop.createCart();
    shop.addItem(a.id, 'p-005', 2);
    shop.addItem(b.id, 'p-005', 1);
    shop.checkout({ cartId: a.id, customer, payment: OK_CARD });
    expect(() => shop.checkout({ cartId: b.id, customer, payment: OK_CARD })).toThrow(/Stock insuffisant/);
  });

  it('refuse de commander un panier vide', () => {
    const cart = shop.createCart();
    expect(() => shop.checkout({ cartId: cart.id, customer, payment: OK_CARD })).toThrow(/vide/);
  });

  it('applique le cycle de vie des commandes et restocke à l annulation', () => {
    const cart = shop.createCart();
    shop.addItem(cart.id, 'p-007', 1);
    const order = shop.checkout({ cartId: cart.id, customer, payment: OK_CARD });
    expect(() => shop.updateOrderStatus(order.id, 'LIVREE')).toThrow(/interdite/);
    shop.updateOrderStatus(order.id, 'ANNULEE');
    expect(shop.getProduct('p-007').stock).toBe(10);
    expect(() => shop.updateOrderStatus(order.id, 'EXPEDIEE')).toThrow(/interdite/);
  });

  it('reset restaure le jeu de données de référence', () => {
    const cart = shop.createCart();
    shop.addItem(cart.id, 'p-005', 2);
    shop.checkout({ cartId: cart.id, customer, payment: OK_CARD });
    shop.reset();
    expect(shop.getProduct('p-005').stock).toBe(2);
    expect(shop.listOrders()).toHaveLength(0);
  });
});
