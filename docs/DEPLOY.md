# IONOS Deployment Guide

This document describes how to deploy the ABC Alumni platform on an IONOS VPS using Docker Compose and the automated GitHub Actions CI/CD pipeline.

---

## Architecture Overview

```
Internet
   │
   ▼
Host Nginx (port 443 / 80)  ← TLS termination via Certbot
   ├─ / → frontend container (port 8080 on host)
   └─ /api/ → backend container (port 4000 on host)
         │
         ▼
     PostgreSQL container (internal network only)
```

Docker images are built and pushed to the GitHub Container Registry (GHCR) by GitHub Actions on every push to `main`. The server pulls the new images and does a rolling restart.

---

## Step 1 — Provision a VPS on IONOS

1. Log in to [IONOS Cloud](https://cloud.ionos.com) (or [MyIonosControl](https://my.ionos.com)).
2. Create a **VPS** or **Cloud Server**:
   - OS: **Ubuntu 24.04 LTS**
   - Minimum: 2 vCPU · 2 GB RAM · 20 GB SSD
3. Note the **public IPv4 address**.
4. Upload your SSH public key during provisioning (or add it afterwards in the control panel).

---

## Step 2 — Point Your Domain to the Server

In your DNS management panel, create an **A record**:

```
@    A    <your-server-IP>
www  A    <your-server-IP>
```

DNS propagation may take a few minutes. Let's Encrypt requires the domain to resolve before issuing a certificate.

---

## Step 3 — Harden and Prepare the Server

SSH in as `root`, then run:

```bash
# Update system packages
apt update && apt upgrade -y

# Create a non-root deploy user
adduser deploy
usermod -aG sudo deploy

# Copy root's authorized_keys to deploy user
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Install Docker and the Compose plugin
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt update && apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Allow the deploy user to run Docker without sudo
usermod -aG docker deploy

# Enable UFW firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## Step 4 — Set Up the Deploy Directory

Switch to the `deploy` user and clone the repository:

```bash
su - deploy
git clone https://github.com/Atepir/abclumni.git /home/deploy/abclumni
cd /home/deploy/abclumni

# Create the production .env file from the example
cp .env.example .env
nano .env   # fill in all values — see Step 5
```

> **Important:** `DEPLOY_PATH` in GitHub Actions must be set to `/home/deploy/abclumni`.

---

## Step 5 — Create the `.env` File

The `.env` file lives at `/home/deploy/abclumni/.env` and is loaded by `docker-compose.prod.yml`. Use `.env.example` as a template:

```env
# PostgreSQL
POSTGRES_USER=abclumni
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=abclumni

# Backend
PORT=4000
CORS_ORIGIN=https://yourdomain.com
DATABASE_URL=postgresql://abclumni:<password>@db:5432/abclumni?schema=public
JWT_SECRET=<64-char-random-string>
SEED_ADMIN_PASSWORD=<strong-admin-password>
SEED_MEMBER_PASSWORD=<strong-member-password>
```

Generate a strong JWT secret with:

```bash
openssl rand -hex 32
```

---

## Step 6 — Add GitHub Actions Secrets and Variables

In the repository: **Settings → Secrets and Variables → Actions**

### Secrets

| Name | Value |
|------|-------|
| `DEPLOY_HOST` | Your IONOS server IP or domain name |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | Contents of the deploy user's **private** SSH key |
| `DEPLOY_PATH` | `/home/deploy/abclumni` |

### Variables (not secrets)

| Name | Value |
|------|-------|
| `VITE_API_BASE_URL` | `https://yourdomain.com/api/v1` |

Also create the **`production` environment** (Settings → Environments) — the CD workflow is scoped to it.

---

## Step 7 — Set Up HTTPS with Host Nginx + Certbot

The frontend container listens on port `8080` on the host. A host-level Nginx acts as the TLS-terminating reverse proxy.

```bash
apt install -y nginx certbot python3-certbot-nginx

cat > /etc/nginx/sites-available/abclumni << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React SPA)
    location / {
        proxy_pass         http://localhost:8080;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass         http://localhost:4000;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
EOF

ln -s /etc/nginx/sites-available/abclumni /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Obtain and install a Let's Encrypt TLS certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will automatically update the Nginx config with HTTPS and set up auto-renewal.

---

## Step 8 — First Manual Deployment

Before the automated pipeline runs, start the stack manually once:

```bash
cd /home/deploy/abclumni

# Authenticate with GHCR (use a GitHub Personal Access Token with read:packages scope)
echo "<your-github-pat>" | docker login ghcr.io -u <your-github-username> --password-stdin

# Pull and start all services
export GITHUB_REPOSITORY=atepir/abclumni
export IMAGE_TAG=latest
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=50
```

---

## Step 9 — Automated CI/CD

Push a commit to `main` (or merge a PR). GitHub Actions will:

1. **CI** (`ci.yml`): typecheck, lint, and build both services.
2. **CD** (`cd.yml`, on `main` only):
   - Build and push Docker images to GHCR (tagged with the short commit SHA and `latest`).
   - SSH into the IONOS server.
   - Pull the new images.
   - Run `docker compose up -d --remove-orphans` for a rolling restart.
   - Prune dangling images.

Monitor progress in: **GitHub → Actions tab**.

---

## Step 10 — Post-Deployment Verification

```bash
# All three containers should be "Up (healthy)" / "Up"
docker compose -f docker-compose.prod.yml ps

# Check backend logs (includes Prisma migrate output)
docker compose -f docker-compose.prod.yml logs backend --tail=40

# Quick health probe
curl http://localhost:4000/api/v1/health
# Expected: {"ok":true,"service":"abc-alumni-api"}

# Frontend HTML
curl -I http://localhost:8080
```

Then open `https://yourdomain.com` in a browser and verify:
- The login page loads.
- JWT authentication works with the seeded demo accounts (`admin@abc.local` / `Admin1234`).
- Prisma migrations ran successfully (check backend logs for `Prisma migrate deploy`).

---

## Summary Checklist

- [ ] IONOS VPS created (Ubuntu 24.04, ≥ 2 GB RAM)
- [ ] Docker + Docker Compose plugin installed
- [ ] `deploy` user created and added to the `docker` group
- [ ] Repository cloned to `/home/deploy/abclumni`
- [ ] `.env` file created with all production secrets
- [ ] GitHub secrets set: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH`
- [ ] GitHub variable set: `VITE_API_BASE_URL`
- [ ] `production` environment created in GitHub
- [ ] Host Nginx configured as reverse proxy + Certbot TLS certificate obtained
- [ ] First manual `docker compose up -d` succeeded and all containers are healthy
- [ ] Push to `main` triggers full CI/CD pipeline successfully
- [ ] App accessible at `https://yourdomain.com`
