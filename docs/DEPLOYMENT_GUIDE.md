# AI Image Judge - Production Deployment Guide

This guide explains how to deploy the entire platform so that anyone on the internet can access and use it.

---

## Architecture Overview

| Component | Tech Stack | Requirements | Current Status |
| :--- | :--- | :--- | :--- |
| **Database & Auth** | Supabase (PostgreSQL) | Remote PostgreSQL & Storage | **Already live in cloud** (`llexnyzdvqjgvlrvzdgr.supabase.co`) |
| **Frontend** | Next.js 16 (React 19, Tailwind) | Node.js / Edge runtime | Ready to deploy |
| **Backend API** | Node.js, Express, TypeScript | Node.js 20+ runtime | Ready to deploy |
| **AI Scoring Engine** | Python 3.10, PyTorch, FastAPI | 2GB–4GB RAM (CPU or GPU) | Ready to deploy |

---

## Option 1: Managed Cloud Platforms (Recommended & Free Tier Friendly)

This is the fastest setup without having to configure Linux servers or SSL certificates manually.

### 1. Database & Storage: Supabase (Already Active)
- Your database, auth, and private storage buckets are already hosted at `https://llexnyzdvqjgvlrvzdgr.supabase.co`.
- In your Supabase Dashboard -> **Authentication** -> **URL Configuration**:
  - Set **Site URL** to your frontend URL (e.g. `https://your-domain.vercel.app`).
  - Add your frontend domain to **Redirect URLs**.

---

### 2. Frontend: Vercel (Free & Instant)
Vercel is built specifically for Next.js.
1. Push your repository to **GitHub**.
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Set **Root Directory** to `frontend`.
5. Add the following **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://llexnyzdvqjgvlrvzdgr.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `sb_publishable_VOEoNCOT9sieoCo4lwzykA_JYq7OAPb`
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-app.onrender.com/api/v1` *(update once backend is deployed)*
6. Click **Deploy**. Vercel will give you a free `https://your-project.vercel.app` URL with automatic SSL.

---

### 3. Backend API: Render or Railway
1. Go to [Render](https://render.com) (or [Railway](https://railway.app)).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Set:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
5. Add **Environment Variables**:
   - `PORT`: `4000`
   - `NODE_ENV`: `production`
   - `SUPABASE_URL`: `https://llexnyzdvqjgvlrvzdgr.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY`: `sb_publishable_VOEoNCOT9sieoCo4lwzykA_JYq7OAPb`
   - `SUPABASE_SECRET_KEY`: `<YOUR_SUPABASE_SECRET_KEY>`
   - `SUPABASE_JWKS_URL`: `https://llexnyzdvqjgvlrvzdgr.supabase.co/auth/v1/.well-known/jwks.json`
   - `AI_SERVICE_URL`: `https://your-ai-service.onrender.com` *(or internal network URL)*
   - `FRONTEND_URL`: `https://your-project.vercel.app`
6. Click **Create Web Service**.

---

### 4. AI Scoring Service: Render (Docker) or Modal / RunPod
Because the AI service runs PyTorch with deep learning models, it needs at least 2GB of RAM.

**Deploying on Render (Docker):**
1. On Render, click **New +** -> **Web Service**.
2. Select your repository.
3. Set **Root Directory**: `ai-service`.
4. Choose **Docker** runtime (it will automatically use [`ai-service/Dockerfile`](file:///c:/Users/ASUS/OneDrive/Desktop/aiphoto/ai-service/Dockerfile)).
5. Choose the **Starter** instance (at least 2GB RAM).
6. Set environment variable:
   - `PORT`: `8000`
   - `MODEL_DEVICE`: `cpu`
7. Click **Create Web Service**.

---

## Option 2: Single Cloud VPS (Lowest Cost & Easiest All-in-One)

You can run the entire platform on a single $6–$10/month Linux VPS (such as **Hetzner CX22**, **DigitalOcean Droplet**, or **Linode**).

### 1. Set Up the VPS
SSH into your server:
```bash
sudo apt update && sudo apt install -y docker.io docker-compose git
```

### 2. Clone the Repository
```bash
git clone https://github.com/your-username/aiphoto.git
cd aiphoto
```

### 3. Configure `.env`
Create a `.env` file in the root directory:
```env
SUPABASE_URL=https://llexnyzdvqjgvlrvzdgr.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_VOEoNCOT9sieoCo4lwzykA_JYq7OAPb
SUPABASE_SECRET_KEY=<YOUR_SUPABASE_SECRET_KEY>
SUPABASE_JWKS_URL=https://llexnyzdvqjgvlrvzdgr.supabase.co/auth/v1/.well-known/jwks.json
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

### 4. Start Everything with One Command
```bash
docker compose up -d --build
```

### 5. Setup SSL with Caddy (Automatic Free HTTPS)
Install Caddy:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```
Create `/etc/caddy/Caddyfile`:
```caddy
yourdomain.com {
    reverse_proxy localhost:3000
}

api.yourdomain.com {
    reverse_proxy localhost:4000
}
```
Restart Caddy:
```bash
sudo systemctl restart caddy
```
Caddy will automatically provision SSL certificates from Let's Encrypt, and your website will be live worldwide!
