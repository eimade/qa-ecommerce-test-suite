import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { SimulatedPaymentGateway } from '../src/domain/payment.js';
import { ShopService } from '../src/domain/shop-service.js';
import { createApp } from '../src/http/app.js';

const ADMIN = 'token-de-test-integration';
const customer = { name: 'Client Test', email: 'client@example.com', address: '1 rue des Tests', postalCode: '33000', city: 'Bordeaux' };

function buildApp(enableTestReset = true) {
  return createApp({ service: new ShopService(new SimulatedPaymentGateway()), adminToken: ADMIN, enableTestReset });
}

describe('API HTTP (intégration Express + service)', () => {
  let app: ReturnType<typeof buildApp>;
  beforeEach(() => {
    app = buildApp();
  });

  it('parcours complet : panier -> promo -> commande -> backoffice', async () => {
    const cart = await request(app).post('/api/carts').expect(201);
    await request(app).post(`/api/carts/${cart.body.id}/items`).send({ productId: 'p-002', quantity: 2 }).expect(201);
    const promo = await request(app).post(`/api/carts/${cart.body.id}/promo`).send({ code: 'BIENVENUE10' }).expect(200);
    expect(promo.body.totals).toEqual({ subtotalCents: 9000, discountCents: 900, shippingCents: 0, totalCents: 8100 });

    const order = await request(app)
      .post('/api/orders')
      .send({ cartId: cart.body.id, customer, payment: { cardNumber: '4242 4242 4242 4242' } })
      .expect(201);
    expect(order.body).toMatchObject({ status: 'PAYEE', promoCode: 'BIENVENUE10' });

    const list = await request(app).get('/api/admin/orders').set('x-admin-token', ADMIN).expect(200);
    expect(list.body.map((o: { id: string }) => o.id)).toEqual([order.body.id]);
    await request(app).patch(`/api/admin/orders/${order.body.id}`).set('x-admin-token', ADMIN).send({ status: 'EXPEDIEE' }).expect(200);
  });

  it('format d erreur stable et codes HTTP adaptés', async () => {
    const res = await request(app).get('/api/products/inconnu').expect(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Produit introuvable' } });

    await request(app).get('/api/products?category=jardin').expect(400);
    await request(app).post('/api/carts/x/items').set('Content-Type', 'application/json').send('{"oops"').expect(400)
      .expect((r) => expect(r.body.error.code).toBe('MALFORMED_JSON'));
    await request(app).get('/api/inexistant').expect(404);
  });

  it('paiement refusé -> 402 PAYMENT_DECLINED', async () => {
    const cart = await request(app).post('/api/carts');
    await request(app).post(`/api/carts/${cart.body.id}/items`).send({ productId: 'p-001', quantity: 1 });
    const res = await request(app)
      .post('/api/orders')
      .send({ cartId: cart.body.id, customer, payment: { cardNumber: '4000000000000002' } })
      .expect(402);
    expect(res.body.error.code).toBe('PAYMENT_DECLINED');
  });

  it('protège le backoffice par jeton', async () => {
    await request(app).get('/api/admin/orders').expect(401);
    await request(app).get('/api/admin/orders').set('x-admin-token', 'mauvais').expect(401);
  });

  it('n expose la remise à zéro qu en environnement de test', async () => {
    await request(app).post('/api/test/reset').expect(204);
    await request(buildApp(false)).post('/api/test/reset').expect(404);
  });

  it('sert les pages statiques de la boutique', async () => {
    const res = await request(app).get('/panier').expect(200);
    expect(res.text).toContain('Mon panier');
  });
});
