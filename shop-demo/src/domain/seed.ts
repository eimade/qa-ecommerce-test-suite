import type { Product } from './types.js';

/** Jeu de données de référence JDD-CAT-01 (voir docs/04-jeux-de-donnees.md). */
export const SEED_PRODUCTS: readonly Product[] = [
  { id: 'p-001', sku: 'TSH-BIO-M', name: 'T-shirt coton bio', category: 'vetements', priceCents: 1990, stock: 50, description: 'T-shirt unisexe en coton biologique, taille M.' },
  { id: 'p-002', sku: 'SWT-CAP-L', name: 'Sweat à capuche', category: 'vetements', priceCents: 4500, stock: 20, description: 'Sweat molletonné, taille L.' },
  { id: 'p-003', sku: 'CAS-LAI-01', name: 'Casquette en laine', category: 'vetements', priceCents: 2400, stock: 0, description: 'Article en rupture de stock.' },
  { id: 'p-004', sku: 'MUG-CER-35', name: 'Mug céramique 35 cl', category: 'maison', priceCents: 1250, stock: 100, description: 'Mug en céramique, passe au lave-vaisselle.' },
  { id: 'p-005', sku: 'LAM-BUR-LED', name: 'Lampe de bureau LED', category: 'maison', priceCents: 3990, stock: 2, description: 'Stock limité : 2 unités.' },
  { id: 'p-006', sku: 'PLD-LIN-130', name: 'Plaid en lin', category: 'maison', priceCents: 5900, stock: 15, description: 'Plaid 130 x 170 cm.' },
  { id: 'p-007', sku: 'CAS-BT-NC', name: 'Casque Bluetooth', category: 'high-tech', priceCents: 8900, stock: 10, description: 'Casque à réduction de bruit active.' },
  { id: 'p-008', sku: 'CHG-USB-C65', name: 'Chargeur USB-C 65 W', category: 'high-tech', priceCents: 2990, stock: 40, description: 'Chargeur rapide pour ordinateur portable.' },
];
