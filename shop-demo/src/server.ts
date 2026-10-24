import { SimulatedPaymentGateway } from './domain/payment.js';
import { ShopService } from './domain/shop-service.js';
import { createApp } from './http/app.js';

const port = Number(process.env.PORT ?? 3000);
const adminToken = process.env.ADMIN_TOKEN;
if (!adminToken || adminToken.length < 12) {
  console.error('ADMIN_TOKEN doit être défini (12 caractères minimum). Voir .env.example.');
  process.exit(1);
}

const service = new ShopService(new SimulatedPaymentGateway());
const app = createApp({ service, adminToken, enableTestReset: process.env.ENABLE_TEST_RESET === 'true' });

const server = app.listen(port, () => {
  console.log(`Uimad QA démo démarrée sur http://localhost:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
