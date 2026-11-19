FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

FROM node:24-alpine
ENV NODE_ENV=production
# Cliente docker: el DockerRunner lanza un contenedor por envío a través del socket del host (ver docs/BITACORA.md, riesgos).
RUN apk add --no-cache docker-cli
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY db/migrations ./db/migrations
USER node
EXPOSE 3000
CMD ["sh", "-c", "node dist/cli/migrate.js && node dist/index.js"]
