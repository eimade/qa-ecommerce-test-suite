import express, { type NextFunction, type Request, type Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppError } from '../domain/errors.js';
import type { ShopService } from '../domain/shop-service.js';

export interface AppOptions {
  service: ShopService;
  adminToken: string;
  /** Expose POST /api/test/reset : à n'activer que dans les environnements de test. */
  enableTestReset: boolean;
}

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public');

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function createApp({ service, adminToken, enableTestReset }: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '20kb' }));

  const api = express.Router();

  api.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Catalogue
  api.get('/products', (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    res.json(service.listProducts({ category, q }));
  });
  api.get('/products/:id', (req, res) => {
    res.json(service.getProduct(req.params.id));
  });

  // Panier
  api.post('/carts', (_req, res) => {
    res.status(201).json(service.createCart());
  });
  api.get('/carts/:id', (req, res) => {
    res.json(service.getCart(req.params.id));
  });
  api.post('/carts/:id/items', (req, res) => {
    res.status(201).json(service.addItem(req.params.id, req.body?.productId, req.body?.quantity));
  });
  api.patch('/carts/:id/items/:productId', (req, res) => {
    res.json(service.updateItem(req.params.id, req.params.productId, req.body?.quantity));
  });
  api.delete('/carts/:id/items/:productId', (req, res) => {
    res.json(service.removeItem(req.params.id, req.params.productId));
  });
  api.post('/carts/:id/promo', (req, res) => {
    res.json(service.applyPromo(req.params.id, req.body?.code));
  });

  // Commande
  api.post('/orders', (req, res) => {
    res.status(201).json(service.checkout(req.body));
  });
  api.get('/orders/:id', (req, res) => {
    res.json(service.getOrder(req.params.id));
  });

  // Backoffice (jeton administrateur)
  const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
    const token = req.header('x-admin-token') ?? '';
    if (!safeEqual(token, adminToken)) throw new AppError(401, 'UNAUTHORIZED', 'Jeton administrateur manquant ou invalide');
    next();
  };
  api.get('/admin/orders', requireAdmin, (req, res) => {
    res.json(service.listOrders(typeof req.query.status === 'string' ? req.query.status : undefined));
  });
  api.patch('/admin/orders/:id', requireAdmin, (req, res) => {
    res.json(service.updateOrderStatus(String(req.params.id), req.body?.status));
  });

  if (enableTestReset) {
    api.post('/test/reset', (_req, res) => {
      service.reset();
      res.status(204).end();
    });
  }

  api.use((_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'Route inconnue')));

  app.use('/api', api);
  app.use(express.static(publicDir, { extensions: ['html'] }));

  // Gestionnaire d'erreurs unique : format JSON stable { error: { code, message, details } }.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
      return;
    }
    const e = err as { type?: string; status?: number };
    if (e?.type === 'entity.parse.failed') {
      res.status(400).json({ error: { code: 'MALFORMED_JSON', message: 'Corps JSON invalide' } });
      return;
    }
    if (e?.type === 'entity.too.large') {
      res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Requête trop volumineuse' } });
      return;
    }
    console.error(err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erreur interne' } });
  });

  return app;
}
