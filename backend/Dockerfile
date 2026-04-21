FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/

RUN npm install

COPY shared ./shared
COPY backend ./backend

RUN npm run build --workspace=backend

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./

EXPOSE 3000

CMD ["node", "dist/index.js"]
