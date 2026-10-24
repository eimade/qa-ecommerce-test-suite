// Client minimal partagé par les pages de la boutique de démonstration.
const CART_KEY = 'shopqa.cartId';

export const euros = (cents) =>
  (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

export async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error?.message ?? 'Erreur'), { code: data.error?.code, status: res.status });
  return data;
}

/** Retourne l'identifiant du panier courant, en recrée un si le précédent a expiré. */
export async function currentCartId() {
  const existing = localStorage.getItem(CART_KEY);
  if (existing) {
    try {
      await api(`/carts/${existing}`);
      return existing;
    } catch {
      localStorage.removeItem(CART_KEY);
    }
  }
  const cart = await api('/carts', { method: 'POST' });
  localStorage.setItem(CART_KEY, cart.id);
  return cart.id;
}

export function forgetCart() {
  localStorage.removeItem(CART_KEY);
}

export async function refreshCartBadge() {
  const badge = document.querySelector('[data-testid="cart-count"]');
  if (!badge) return;
  const cart = await api(`/carts/${await currentCartId()}`);
  badge.textContent = String(cart.lines.reduce((n, l) => n + l.quantity, 0));
}

export function showMessage(text, kind = 'info') {
  const box = document.querySelector('[data-testid="message"]');
  box.textContent = text;
  box.className = `message ${kind}`;
  box.hidden = false;
}

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'testid') node.dataset.testid = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
}
