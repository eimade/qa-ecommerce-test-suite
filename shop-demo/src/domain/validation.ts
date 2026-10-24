import { invalid } from './errors.js';
import type { Customer } from './types.js';

export const MAX_QUANTITY_PER_LINE = 10;

export function parseQuantity(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > MAX_QUANTITY_PER_LINE) {
    throw invalid(`La quantité doit être un entier entre 1 et ${MAX_QUANTITY_PER_LINE}`, { field: 'quantity' });
  }
  return value;
}

function requireString(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw invalid(`Le champ ${field} est obligatoire`, { field });
  }
  return value.trim();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const POSTAL_CODE_RE = /^\d{5}$/;

export function parseCustomer(input: unknown): Customer {
  if (!input || typeof input !== 'object') {
    throw invalid('Les informations client sont obligatoires', { field: 'customer' });
  }
  const body = input as Record<string, unknown>;
  const customer: Customer = {
    name: requireString(body, 'name'),
    email: requireString(body, 'email').toLowerCase(),
    address: requireString(body, 'address'),
    postalCode: requireString(body, 'postalCode'),
    city: requireString(body, 'city'),
  };
  if (customer.name.length > 100) throw invalid('Nom trop long (100 caractères maximum)', { field: 'name' });
  if (!EMAIL_RE.test(customer.email)) throw invalid('Adresse email invalide', { field: 'email' });
  if (!POSTAL_CODE_RE.test(customer.postalCode)) throw invalid('Code postal invalide (5 chiffres)', { field: 'postalCode' });
  return customer;
}

/** Algorithme de Luhn : rejette les numéros de carte mal saisis avant l'appel au prestataire. */
export function isValidLuhn(cardNumber: string): boolean {
  if (!/^\d{12,19}$/.test(cardNumber)) return false;
  let sum = 0;
  let double = false;
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = Number(cardNumber[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

export function parseCardNumber(input: unknown): string {
  const raw = input && typeof input === 'object' ? (input as Record<string, unknown>).cardNumber : undefined;
  if (typeof raw !== 'string') throw invalid('Le numéro de carte est obligatoire', { field: 'cardNumber' });
  const cardNumber = raw.replace(/[\s-]/g, '');
  if (!isValidLuhn(cardNumber)) throw invalid('Numéro de carte invalide', { field: 'cardNumber' });
  return cardNumber;
}
