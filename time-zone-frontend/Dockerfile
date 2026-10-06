#---------------------------
# Etape de build
FROM node:22-alpine AS builder

WORKDIR /app

# Installation reproductible à partir du lockfile
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY angular.json tsconfig.json tsconfig.app.json ./
COPY src/ ./src/
COPY public/ ./public/

RUN npm run build

#---------------------------
# Etape de lancement
# Image nginx officielle non root, écoute sur 8080
FROM nginxinc/nginx-unprivileged:1.28-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/browser /usr/share/nginx/html

EXPOSE 8080
