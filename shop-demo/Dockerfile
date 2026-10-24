# Image de la boutique de démonstration (contexte de build : racine du dépôt).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY shop-demo ./shop-demo
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/shop-demo/dist ./shop-demo/dist
COPY shop-demo/public ./shop-demo/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "shop-demo/dist/server.js"]
