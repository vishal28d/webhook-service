FROM node:18-alpine AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

FROM node:18-alpine AS backend-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server ./
RUN npx tsc

FROM node:18-alpine
WORKDIR /app
COPY --from=backend-build /app/server/dist ./server/dist
COPY --from=backend-build /app/server/package*.json ./server/
COPY --from=frontend-build /app/client/dist ./client/dist

WORKDIR /app/server
RUN npm install --production
EXPOSE 3000
CMD ["node", "dist/index.js"]
