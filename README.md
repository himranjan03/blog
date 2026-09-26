# Personal Hub

A ready-to-host personal site with a portfolio, career timeline, blog, software release cards, social links, and a small JSON content API. It uses [Express](https://expressjs.com/), an open-source Node.js web framework.

## Start locally

```bash
npm install
cp .env.example .env
# Edit .env and set ADMIN_TOKEN to a long unique secret
npm start
```

Open `http://localhost:3000`. The protected editor is at `http://localhost:3000/admin.html`; it lets you update your profile, experience, posts, release versions, and links with your admin token. You can also edit `data/content.json` directly; restart is not necessary because the server reads it per request.

## Run with PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Set `ADMIN_TOKEN` and `PORT` in your hosting environment before running PM2. For example:

```bash
ADMIN_TOKEN='use-a-long-random-value' PORT=3000 pm2 start ecosystem.config.cjs --update-env
```

Useful commands: `pm2 status`, `pm2 logs personal-hub`, and `pm2 restart personal-hub`.

## Content API

- `GET /api/health` — health check for hosting/monitoring
- `GET /api/content` — public site data (article bodies excluded)
- `GET /api/posts/:id` — a complete blog post
- `GET /api/admin/content` — full editable content, admin token required
- `PUT /api/admin/content` — replaces all site content. Requires header `x-admin-token` matching `ADMIN_TOKEN`.

Example update (make a backup of `data/content.json` first):

```bash
curl -X PUT http://localhost:3000/api/admin/content \
  -H 'Content-Type: application/json' \
  -H 'x-admin-token: your-secret' \
  --data-binary @data/content.json
```

For a public deployment, put this Node service behind HTTPS using your host’s reverse proxy (for example Nginx, Caddy, or a managed platform) and set a strong, private admin token.
