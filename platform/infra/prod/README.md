# Production Deployment Template

This directory contains the first production-oriented deployment template for the public frontend services.

## Public Entrypoints

Use Nginx on the host as the public HTTPS entrypoint:

| Domain | Upstream |
| --- | --- |
| `https://app.example.com` | `127.0.0.1:8008` Digital Life |
| `https://console.example.com` | `127.0.0.1:3200` Platform Console |
| `https://api.example.com` | `127.0.0.1:8088` Platform Gateway |
| `https://new-api.example.com` | `127.0.0.1:3005` New API |

Do not expose the Docker service ports directly to the public internet. The compose file binds app ports to `127.0.0.1`.

## Setup

1. Copy the environment template:

```bash
cd /home/sgj/projects/NewAPI/platform
cp infra/prod/.env.example infra/prod/.env
```

2. Edit every `CHANGE_ME` value and replace the example domains:

```bash
nano infra/prod/.env
```

Generate strong secrets with:

```bash
openssl rand -hex 32
```

3. Start the production stack:

```bash
docker compose --env-file infra/prod/.env -f infra/prod/docker-compose.yml up -d --build
```

4. Install the HTTP-only Nginx bootstrap site before issuing the first certificate:

```bash
sudo mkdir -p /var/www/certbot
sudo cp infra/prod/nginx/api-aggregation-platform.bootstrap.conf /etc/nginx/sites-available/api-aggregation-platform.conf
sudo ln -sf /etc/nginx/sites-available/api-aggregation-platform.conf /etc/nginx/sites-enabled/api-aggregation-platform.conf
sudo nginx -t
sudo systemctl reload nginx
```

5. Issue one certificate after DNS points all domains to this server:

```bash
sudo certbot certonly --webroot -w /var/www/certbot \
  --cert-name api-aggregation-platform \
  -d app.example.com \
  -d console.example.com \
  -d api.example.com \
  -d new-api.example.com
```

6. Install the final HTTPS Nginx site config:

```bash
sudo cp infra/prod/nginx/api-aggregation-platform.conf /etc/nginx/sites-available/api-aggregation-platform.conf
sudo ln -sf /etc/nginx/sites-available/api-aggregation-platform.conf /etc/nginx/sites-enabled/api-aggregation-platform.conf
sudo nginx -t
sudo systemctl reload nginx
```

## Notes

- `platform-console` is built with production `NEXT_PUBLIC_*` values. Rebuild it after changing public URLs.
- Replace all `*.example.com` values in `.env` and the Nginx config with the same real domains.
- `PLATFORM_CONSOLE_COOKIE_SECURE=true` requires HTTPS.
- Keep `platform/infra/prod/.env` out of Git. It contains production secrets.
- `Digital_life/backend/data/agent_workspace` is stored in the `digital_life_workspace` Docker volume.
