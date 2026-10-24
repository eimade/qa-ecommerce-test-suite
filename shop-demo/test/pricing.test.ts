import { describe, expect, it } from 'vitest';
import { computeTotals, findPromo } from '../src/domain/pricing.js';
import { isValidLuhn, parseCardNumber, parseCustomer, parseQuantity } from '../src/domain/validation.js';

const validCustomer = { name: 'Client Test', email: 'Client.Test@example.com', address: '1 rue des Tests', postalCode: '75001', city: 'Paris' };

describe('computeTotals (EX-PAN-04, EX-PAN-05)', () => {
  it('ajoute 4,90 EUR de livraison sous le seuil de 50 EUR', () => {
    expect(computeTotals([{ unitPriceCents: 1990, quantity: 2 }])).toEqual({
      subtotalCents: 3980, discountCents: 0, shippingCents: 490, totalCents: 4470,
    });
  });

  it('offre la livraison à partir de 50 EUR exactement (valeur limite)', () => {
    expect(computeTotals([{ unitPriceCents: 2500, quantity: 2 }]).shippingCents).toBe(0);
    expect(computeTotals([{ unitPriceCents: 4999, quantity: 1 }]).shippingCents).toBe(490);
  });

  it('applique BIENVENUE10 avec arrondi au centime inférieur', () => {
    const t = computeTotals([{ unitPriceCents: 1995, quantity: 1 }], 'bienvenue10');
    expect(t.discountCents).toBe(199);
    expect(t.totalCents).toBe(1995 - 199 + 490);
  });

  it('évalue le seuil de livraison après remise', () => {
    // 54 EUR - 10 % = 48,60 EUR : sous le seuil, la livraison redevient payante.
    const t = computeTotals([{ unitPriceCents: 5400, quantity: 1 }], 'BIENVENUE10');
    expect(t.shippingCents).toBe(490);
  });

  it('le code LIVRAISON annule les frais de port', () => {
    expect(computeTotals([{ unitPriceCents: 1000, quantity: 1 }], 'LIVRAISON')).toMatchObject({ shippingCents: 0, totalCents: 1000 });
  });

  it('panier vide : total nul et pas de frais', () => {
    expect(computeTotals([])).toEqual({ subtotalCents: 0, discountCents: 0, shippingCents: 0, totalCents: 0 });
  });

  it('ignore un code inconnu', () => {
    expect(findPromo('NOEL99')).toBeUndefined();
  });
});

describe('validation des entrées', () => {
  it.each([0, 11, 1.5, '2', null])('refuse la quantité %s', (q) => {
    expect(() => parseQuantity(q)).toThrow(/entier entre 1 et 10/);
  });

  it('accepte les bornes 1 et 10', () => {
    expect(parseQuantity(1)).toBe(1);
    expect(parseQuantity(10)).toBe(10);
  });

  it('normalise l email client en minuscules', () => {
    expect(parseCustomer(validCustomer).email).toBe('client.test@example.com');
  });

  it.each([
    ['email', 'pas-un-email'],
    ['postalCode', '7500'],
    ['city', '   '],
  ])('refuse un client avec %s = "%s"', (field, value) => {
    expect(() => parseCustomer({ ...validCustomer, [field]: value })).toThrow();
  });

  it('contrôle Luhn des numéros de carte', () => {
    expect(isValidLuhn('4242424242424242')).toBe(true);
    expect(isValidLuhn('4242424242424241')).toBe(false);
    expect(parseCardNumber({ cardNumber: '4242 4242 4242 4242' })).toBe('4242424242424242');
    expect(() => parseCardNumber({ cardNumber: '1234' })).toThrow(/invalide/);
  });
});
