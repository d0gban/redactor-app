# ---- Build the app. Only the compiled files reach the final image.
FROM node:22-alpine AS build

WORKDIR /src
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Serve it: nginx (non-root) sends the files and the security headers. No Node, no app server.
FROM nginxinc/nginx-unprivileged:stable-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /src/dist /usr/share/nginx/html

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8000/healthz || exit 1
