FROM node:20-alpine AS build

WORKDIR /app

COPY app/package.json app/package-lock.json ./

ARG VITE_DEFAULT_API_MODE=live
ARG VITE_LIVE_API_BASE_URL=http://localhost:8000
ARG VITE_MOCK_API_BASE_URL=http://localhost:5003
ARG VITE_SUPPORTS_AGENT_TOOLS=false
ARG VITE_SUPPORTS_EDIT_EXISTING_ASSETS=false

ENV VITE_DEFAULT_API_MODE=${VITE_DEFAULT_API_MODE}
ENV VITE_LIVE_API_BASE_URL=${VITE_LIVE_API_BASE_URL}
ENV VITE_MOCK_API_BASE_URL=${VITE_MOCK_API_BASE_URL}
ENV VITE_SUPPORTS_AGENT_TOOLS=${VITE_SUPPORTS_AGENT_TOOLS}
ENV VITE_SUPPORTS_EDIT_EXISTING_ASSETS=${VITE_SUPPORTS_EDIT_EXISTING_ASSETS}

RUN npm ci

COPY app/ ./

RUN npm run build

FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/frontend-env.sh /docker-entrypoint.d/40-patra-env.sh
COPY --from=build /app/dist /usr/share/nginx/html
RUN chmod +x /docker-entrypoint.d/40-patra-env.sh

EXPOSE 80
