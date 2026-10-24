import type { Totals } from './types.js';

export const FREE_SHIPPING_THRESHOLD_CENTS = 5000;
export const SHIPPING_CENTS = 490;

export interface PromoRule {
  code: string;
  label: string;
  percentOff?: number;
  freeShipping?: boolean;
}

export const PROMO_CODES: Record<string, PromoRule> = {
  BIENVENUE10: { code: 'BIENVENUE10', label: '10 % sur le panier', percentOff: 10 },
  LIVRAISON: { code: 'LIVRAISON', label: 'Livraison offerte', freeShipping: true },
};

export function findPromo(code: string | undefined): PromoRule | undefined {
  if (!code) return undefined;
  return PROMO_CODES[code.trim().toUpperCase()];
}

/**
 * Règles de calcul (exigences EX-PAN-04 et EX-PAN-05, voir docs/02-plan-de-tests.md) :
 * - remise en pourcentage arrondie au centime inférieur, appliquée au sous-total ;
 * - livraison 4,90 EUR, offerte si le sous-total après remise atteint 50 EUR ou avec le code LIVRAISON ;
 * - panier vide : aucun frais.
 */
export function computeTotals(
  lines: { unitPriceCents: number; quantity: number }[],
  promoCode?: string,
): Totals {
  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  const promo = findPromo(promoCode);
  const discountCents = promo?.percentOff ? Math.floor((subtotalCents * promo.percentOff) / 100) : 0;
  const afterDiscount = subtotalCents - discountCents;
  const shippingCents =
    subtotalCents === 0 || promo?.freeShipping || afterDiscount >= FREE_SHIPPING_THRESHOLD_CENTS
      ? 0
      : SHIPPING_CENTS;
  return { subtotalCents, discountCents, shippingCents, totalCents: afterDiscount + shippingCents };
}
