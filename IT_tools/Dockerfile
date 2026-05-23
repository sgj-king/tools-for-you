# build stage
FROM node:lts-alpine AS build-stage
ENV NPM_CONFIG_LOGLEVEL=warn \
    CI=true \
    NODE_OPTIONS=--max_old_space_size=4096
WORKDIR /app

ARG VITE_DIGITAL_LIFE_URL=""
ARG VITE_PLATFORM_CONSOLE_URL=""
ENV VITE_DIGITAL_LIFE_URL=${VITE_DIGITAL_LIFE_URL} \
    VITE_PLATFORM_CONSOLE_URL=${VITE_PLATFORM_CONSOLE_URL}

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@9.11.0 && pnpm i --frozen-lockfile

COPY . .
RUN pnpm build

# production stage
FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
