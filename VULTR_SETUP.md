# Vultr Database Setup Complete

## ⚠️ IMPORTANT - TODO BEFORE PRODUCTION

**UPGRADE TO CUSTOM DOMAIN WITH PROPER SSL REQUIRED**

The current setup uses a Cloudflare Tunnel quick URL which is:
- ❌ **Temporary** - No uptime guarantee
- ❌ **Not suitable for production**
- ❌ **URL can change if tunnel restarts**

**Action Required:** Set up a custom domain with proper SSL certificate before production launch.
See "Upgrading to Custom Domain" section below.

---

## Deployment Information

**Vultr Instance IP:** 144.202.15.249

**Current API URL:** https://wma-liked-membership-berry.trycloudflare.com

**API Key (save this!):** e66e2a9c1e0b881c349a39ef5cba347c68ce27d8fea0970c21a2425f25e05882

**Health Check:** https://wma-liked-membership-berry.trycloudflare.com/health

## Next Steps

### 1. Set Raindrop Environment Variable

Run this command to set the Vultr API key in Raindrop:

```bash
raindrop env set VULTR_DB_API_KEY e66e2a9c1e0b881c349a39ef5cba347c68ce27d8fea0970c21a2425f25e05882
```

### 2. Deploy Updated Services

After setting the environment variable, deploy:

```bash
raindrop build deploy
```

### 3. Test

Test the personas endpoint:

```bash
curl https://svc-01k9fhfycrjp84j2sg746gwy9q.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/personas
```

You should see Brad, Sarah, and Alex!

## Architecture

```
┌─────────────────────────────────────────────────┐
│ Raindrop (Cloudflare Workers)                   │
│  └─ persona-manager service                     │
│     └─ Uses db-helpers-vultr.ts                 │
└───────────────────┬─────────────────────────────┘
                    │
         HTTP + API Key (Bearer Token)
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│ Vultr (144.202.15.249)                          │
│  ├─ Express API Proxy (Port 3000)               │
│  │  └─ Endpoints: /health, /query, /batch       │
│  │                                               │
│  └─ PostgreSQL (localhost:5432)                 │
│     └─ Database: call_me_back                   │
│     └─ Tables: personas, user_persona_...       │
└─────────────────────────────────────────────────┘
```

## Management Commands

### Vultr Instance

SSH into instance:
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249
```

View API proxy logs:
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 logs db-proxy"
```

Restart API proxy:
```bash
ssh -i ~/.ssh/vultr_cmb root@144.202.15.249 "pm2 restart db-proxy"
```

### Database Queries

Run a query (create a script in /opt/vultr-db-proxy):
```bash
#!/bin/bash
source .env
PGPASSWORD="$DB_PASSWORD" psql -h localhost -U cmb_user -d call_me_back -c "YOUR_QUERY_HERE"
```

## Security Notes

- ✅ PostgreSQL listens on localhost only (127.0.0.1)
- ✅ API key required for all /query and /batch endpoints
- ✅ Parameterized queries prevent SQL injection
- ✅ HTTPS should be added for production (Let's Encrypt)

## Personas in Database

Currently seeded with:
- **Brad** (coach) - Decisive and confident friend
- **Sarah** (friend) - Warm, empathetic listener
- **Alex** (creative) - Energetic creative thinker

## Costs

- Vultr Instance: $5/month (vc2-1c-1gb)
- Available Credit: ~$495 remaining (from $500 hackathon credit)

---

## Upgrading to Custom Domain (REQUIRED FOR PRODUCTION)

### Why This is Needed

The current Cloudflare Tunnel quick URL (`*.trycloudflare.com`) is:
- Temporary with no SLA
- Can change if the tunnel restarts
- Not suitable for production use
- Subject to Cloudflare's free tier limitations

### Steps to Upgrade

#### Option 1: Cloudflare Tunnel with Custom Domain (Recommended)

1. **Get a domain name** (e.g., from Namecheap, Google Domains, etc.)

2. **Add domain to Cloudflare** (free plan is fine)
   - Go to https://dash.cloudflare.com/
   - Add your domain
   - Update nameservers at your registrar

3. **Create named Cloudflare Tunnel**
   ```bash
   # On Vultr instance
   cloudflare login
   cloudflared tunnel create call-me-back-db
   cloudflared tunnel route dns call-me-back-db db.yourdomain.com
   ```

4. **Configure tunnel to run as service**
   ```bash
   # Create config
   cat > ~/.cloudflared/config.yml << EOF
   tunnel: call-me-back-db
   credentials-file: /root/.cloudflared/<tunnel-id>.json

   ingress:
     - hostname: db.yourdomain.com
       service: http://localhost:3000
     - service: http_status:404
   EOF

   # Install as service
   cloudflared service install
   systemctl enable cloudflared
   systemctl start cloudflared
   ```

5. **Update Raindrop manifest**
   ```toml
   env "VULTR_DB_API_URL" {
     default = "https://db.yourdomain.com"
   }
   ```

6. **Redeploy**
   ```bash
   raindrop build deploy
   ```

#### Option 2: Let's Encrypt with Nginx

1. **Get a domain name** and point an A record to `144.202.15.249`

2. **Install Nginx and Certbot**
   ```bash
   ssh root@144.202.15.249
   apt install nginx certbot python3-certbot-nginx -y
   ```

3. **Configure Nginx**
   ```bash
   cat > /etc/nginx/sites-available/db-api << 'EOF'
   server {
       listen 80;
       server_name db.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   EOF

   ln -s /etc/nginx/sites-available/db-api /etc/nginx/sites-enabled/
   nginx -t && systemctl reload nginx
   ```

4. **Get SSL certificate**
   ```bash
   certbot --nginx -d db.yourdomain.com
   ```

5. **Update Raindrop manifest and redeploy** (same as Option 1, step 5-6)

### Monitoring and Maintenance

- **Cloudflare Tunnel**: Auto-reconnects, no certificate renewal needed
- **Let's Encrypt**: Certbot auto-renews certificates (check with `certbot renew --dry-run`)
- **Cost**: Both options are free (just domain registration cost)

### Testing After Upgrade

```bash
# Test health endpoint
curl https://db.yourdomain.com/health

# Test query
curl -X POST https://db.yourdomain.com/query \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT COUNT(*) FROM personas","params":[]}'

# Test from Raindrop
curl https://svc-YOUR-APP.lmapp.run/api/personas
```
