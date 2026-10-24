import { randomUUID } from 'node:crypto';
import { AppError, invalid, notFound } from './errors.js';
import type { PaymentGateway } from './payment.js';
import { computeTotals, findPromo } from './pricing.js';
import { SEED_PRODUCTS } from './seed.js';
import { CATEGORIES, type Cart, type Category, type Order, type OrderStatus, type Product, type Totals } from './types.js';
import { parseCardNumber, parseCustomer, parseQuantity } from './validation.js';

export interface CartView {
  id: string;
  lines: (CartLineView)[];
  promoCode?: string;
  totals: Totals;
}

interface CartLineView {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

/** Transitions autorisées dans le backoffice (exigence EX-BO-02). */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PAYEE: ['EXPEDIEE', 'ANNULEE'],
  EXPEDIEE: ['LIVREE'],
  LIVREE: [],
  ANNULEE: [],
};

/**
 * Couche service de la boutique de démonstration. Stockage en mémoire volontaire :
 * l'objet du projet est la démarche de test, pas la persistance. `reset()` restaure le
 * jeu de données de référence pour garantir des tests reproductibles.
 */
export class ShopService {
  private products = new Map<string, Product>();
  private carts = new Map<string, Cart>();
  private orders = new Map<string, Order>();
  private orderSeq = 0;

  constructor(private readonly payment: PaymentGateway & { reset?: () => void }) {
    this.reset();
  }

  reset(): void {
    this.products = new Map(SEED_PRODUCTS.map((p) => [p.id, { ...p }]));
    this.carts.clear();
    this.orders.clear();
    this.orderSeq = 0;
    this.payment.reset?.();
  }

  // ---------- Catalogue ----------

  listProducts(filters: { category?: string; q?: string } = {}): Product[] {
    if (filters.category && !CATEGORIES.includes(filters.category as Category)) {
      throw invalid(`Catégorie inconnue : ${filters.category}`, { field: 'category', allowed: CATEGORIES });
    }
    const q = filters.q?.trim().toLowerCase();
    return [...this.products.values()].filter(
      (p) =>
        (!filters.category || p.category === filters.category) &&
        (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)),
    );
  }

  getProduct(id: string): Product {
    const product = this.products.get(id);
    if (!product) throw notFound('Produit');
    return product;
  }

  // ---------- Panier ----------

  createCart(): CartView {
    const cart: Cart = { id: randomUUID(), lines: [], createdAt: new Date().toISOString() };
    this.carts.set(cart.id, cart);
    return this.view(cart);
  }

  getCart(id: string): CartView {
    return this.view(this.findCart(id));
  }

  addItem(cartId: string, productId: unknown, quantity: unknown): CartView {
    const cart = this.findCart(cartId);
    if (typeof productId !== 'string') throw invalid('Le champ productId est obligatoire', { field: 'productId' });
    const qty = parseQuantity(quantity);
    const product = this.getProduct(productId);
    const existing = cart.lines.find((l) => l.productId === productId);
    const target = (existing?.quantity ?? 0) + qty;
    parseQuantity(target);
    this.assertStock(product, target);
    if (existing) existing.quantity = target;
    else cart.lines.push({ productId, quantity: qty });
    return this.view(cart);
  }

  updateItem(cartId: string, productId: string, quantity: unknown): CartView {
    const cart = this.findCart(cartId);
    const line = cart.lines.find((l) => l.productId === productId);
    if (!line) throw notFound('Ligne de panier');
    const qty = parseQuantity(quantity);
    this.assertStock(this.getProduct(productId), qty);
    line.quantity = qty;
    return this.view(cart);
  }

  removeItem(cartId: string, productId: string): CartView {
    const cart = this.findCart(cartId);
    const before = cart.lines.length;
    cart.lines = cart.lines.filter((l) => l.productId !== productId);
    if (cart.lines.length === before) throw notFound('Ligne de panier');
    return this.view(cart);
  }

  applyPromo(cartId: string, code: unknown): CartView {
    const cart = this.findCart(cartId);
    if (typeof code !== 'string' || code.trim() === '') throw invalid('Le champ code est obligatoire', { field: 'code' });
    const promo = findPromo(code);
    if (!promo) throw new AppError(422, 'PROMO_INVALID', 'Code promo inconnu ou expiré');
    cart.promoCode = promo.code;
    return this.view(cart);
  }

  // ---------- Commande ----------

  checkout(body: unknown): Order {
    const input = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
    if (typeof input.cartId !== 'string') throw invalid('Le champ cartId est obligatoire', { field: 'cartId' });
    const cart = this.findCart(input.cartId);
    const customer = parseCustomer(input.customer);
    const cardNumber = parseCardNumber(input.payment);
    if (cart.lines.length === 0) throw new AppError(422, 'CART_EMPTY', 'Le panier est vide');

    // Revérification du stock au moment du paiement (un autre client a pu acheter entre-temps).
    for (const line of cart.lines) this.assertStock(this.getProduct(line.productId), line.quantity);

    const view = this.view(cart);
    const result = this.payment.charge(cardNumber, view.totals.totalCents);
    if (!result.accepted) throw new AppError(402, 'PAYMENT_DECLINED', result.reason);

    for (const line of cart.lines) this.getProduct(line.productId).stock -= line.quantity;
    this.orderSeq += 1;
    const order: Order = {
      id: `CMD-${String(this.orderSeq).padStart(5, '0')}`,
      lines: cart.lines.map((l) => {
        const p = this.getProduct(l.productId);
        return { productId: p.id, sku: p.sku, name: p.name, unitPriceCents: p.priceCents, quantity: l.quantity };
      }),
      customer,
      promoCode: cart.promoCode,
      totals: view.totals,
      status: 'PAYEE',
      paymentReference: result.reference,
      createdAt: new Date().toISOString(),
    };
    this.orders.set(order.id, order);
    this.carts.delete(cart.id);
    return order;
  }

  getOrder(id: string): Order {
    const order = this.orders.get(id);
    if (!order) throw notFound('Commande');
    return order;
  }

  // ---------- Backoffice ----------

  listOrders(status?: string): Order[] {
    return [...this.orders.values()].filter((o) => !status || o.status === status);
  }

  updateOrderStatus(id: string, status: unknown): Order {
    const order = this.getOrder(id);
    if (typeof status !== 'string' || !(status in TRANSITIONS)) {
      throw invalid('Statut inconnu', { field: 'status', allowed: Object.keys(TRANSITIONS) });
    }
    const next = status as OrderStatus;
    if (!TRANSITIONS[order.status].includes(next)) {
      throw new AppError(409, 'INVALID_TRANSITION', `Transition ${order.status} -> ${next} interdite`);
    }
    if (next === 'ANNULEE') {
      for (const line of order.lines) this.getProduct(line.productId).stock += line.quantity;
    }
    order.status = next;
    return order;
  }

  // ---------- Interne ----------

  private findCart(id: string): Cart {
    const cart = this.carts.get(id);
    if (!cart) throw notFound('Panier');
    return cart;
  }

  private assertStock(product: Product, quantity: number): void {
    if (quantity > product.stock) {
      throw new AppError(409, 'OUT_OF_STOCK', `Stock insuffisant pour ${product.name} (disponible : ${product.stock})`, {
        productId: product.id,
        available: product.stock,
      });
    }
  }

  private view(cart: Cart): CartView {
    const lines = cart.lines.map((l) => {
      const p = this.getProduct(l.productId);
      return {
        productId: p.id,
        name: p.name,
        unitPriceCents: p.priceCents,
        quantity: l.quantity,
        lineTotalCents: p.priceCents * l.quantity,
      };
    });
    return { id: cart.id, lines, promoCode: cart.promoCode, totals: computeTotals(lines, cart.promoCode) };
  }
}
