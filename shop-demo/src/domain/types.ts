export type Category = 'vetements' | 'maison' | 'high-tech';
export const CATEGORIES: readonly Category[] = ['vetements', 'maison', 'high-tech'];

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: Category;
  /** Prix en centimes d'euro pour éviter les erreurs d'arrondi. */
  priceCents: number;
  stock: number;
  description: string;
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface Cart {
  id: string;
  lines: CartLine[];
  promoCode?: string;
  createdAt: string;
}

export interface Totals {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
}

export interface Customer {
  name: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
}

export type OrderStatus = 'PAYEE' | 'EXPEDIEE' | 'LIVREE' | 'ANNULEE';

export interface OrderLine {
  productId: string;
  sku: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
}

export interface Order {
  id: string;
  lines: OrderLine[];
  customer: Customer;
  promoCode?: string;
  totals: Totals;
  status: OrderStatus;
  paymentReference: string;
  createdAt: string;
}
