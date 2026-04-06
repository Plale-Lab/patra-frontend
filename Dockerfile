FROM node:20-alpine AS build

WORKDIR /app

COPY app/package.json app/package-lock.json ./

ARG VITE_API_BASE_URL=http://localhost:8000

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm ci

COPY app/ ./

RUN npm run build

FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/frontend-env.sh /docker-entrypoint.d/40-patra-env.sh
COPY --from=build /app/dist /usr/share/nginx/html
RUN chmod +x /docker-entrypoint.d/40-patra-env.sh

EXPOSE 80
