# Caddy Setup for Log Query Service

**Subdomain:** logs.ai-tools-marketplace.io
**Service:** localhost:3001
**Date:** 2025-11-20

---

## Quick Setup

### 1. SSH to Vultr Server
```bash
ssh root@144.202.15.249
```

### 2. Edit Caddy Configuration
```bash
sudo nano /etc/caddy/Caddyfile
```

### 3. Add This Block
```caddy
logs.ai-tools-marketplace.io {
    reverse_proxy localhost:3001

    header {
        Access-Control-Allow-Origin *
        Access-Control-Allow-Methods "GET, POST, OPTIONS"
        Access-Control-Allow-Headers "Authorization, Content-Type"
    }

    encode gzip

    log {
        output file /var/log/caddy/logs-service.log
        format json
    }
}
```

### 4. Test Configuration
```bash
caddy validate --config /etc/caddy/Caddyfile
```

### 5. Reload Caddy
```bash
sudo systemctl reload caddy
```

### 6. Check Status
```bash
sudo systemctl status caddy
```

### 7. Test Locally (from Vultr)
```bash
curl http://localhost:3001/health
# Should return: {"status":"healthy",...}

curl https://logs.ai-tools-marketplace.io/health
# Should return same, but via HTTPS!
```

### 8. Test Externally (from dev machine)
```bash
curl https://logs.ai-tools-marketplace.io/health
# Should work with valid SSL cert
```

---

## Troubleshooting

### Issue: "Connection refused"
```bash
# Check if service is running
pm2 status | grep log-query-service

# Check if listening on localhost:3001
netstat -tuln | grep 3001
# Should show: 127.0.0.1:3001 LISTEN
```

### Issue: "SSL certificate error"
```bash
# Check Caddy logs
sudo journalctl -u caddy -n 50

# Manually trigger cert
sudo caddy reload --config /etc/caddy/Caddyfile
```

### Issue: "404 Not Found"
```bash
# Check if Caddy proxy is working
curl -v https://logs.ai-tools-marketplace.io/
# Should proxy to localhost:3001
```

---

## DNS Verification

Before Caddy can issue SSL cert, DNS must point to Vultr:

```bash
# Check DNS
dig logs.ai-tools-marketplace.io

# Should show:
# logs.ai-tools-marketplace.io.  300  IN  A  144.202.15.249
```

If not:
1. Go to your DNS provider (Cloudflare, Namecheap, etc.)
2. Add A record:
   - **Name:** logs
   - **Type:** A
   - **Value:** 144.202.15.249
   - **TTL:** 300 (5 minutes)
3. Wait 5-10 minutes for propagation
4. Retry `dig` command

---

## Security Checklist

- [ ] Service binds to localhost:3001 (not 0.0.0.0)
- [ ] Caddy configuration added
- [ ] Caddy reloaded successfully
- [ ] SSL certificate issued automatically
- [ ] External HTTPS access works
- [ ] Direct port 3001 access blocked (firewall)
- [ ] CORS headers configured for Raindrop
- [ ] Logs directory exists: /var/log/caddy/

---

## Full Caddyfile Example

```caddy
# /etc/caddy/Caddyfile

# Voice Pipeline
voice.ai-tools-marketplace.io {
    reverse_proxy localhost:8080
    encode gzip
}

# Database Proxy
db.ai-tools-marketplace.io {
    reverse_proxy localhost:3000
    encode gzip
}

# Log Query Service (NEW)
logs.ai-tools-marketplace.io {
    reverse_proxy localhost:3001

    header {
        Access-Control-Allow-Origin *
        Access-Control-Allow-Methods "GET, POST, OPTIONS"
        Access-Control-Allow-Headers "Authorization, Content-Type"
    }

    encode gzip

    log {
        output file /var/log/caddy/logs-service.log
        format json
    }
}
```

---

## After Setup Complete

Update these environment variables:

### Raindrop (API Gateway)
```bash
raindrop build env set env:LOG_QUERY_SERVICE_URL "https://logs.ai-tools-marketplace.io"
```

### Frontend (.env)
```bash
# Already set, no change needed:
VITE_API_URL=https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run
```

---

## Deployment Script Update

The deploy script should also copy the Caddy config:

```bash
# After deploying the service, remind about Caddy:
echo "⚠️  Don't forget to update Caddy!"
echo "    sudo nano /etc/caddy/Caddyfile"
echo "    # Add logs.ai-tools-marketplace.io block"
echo "    sudo systemctl reload caddy"
```

---

**Status:** Ready to deploy!
**Next Step:** SSH to Vultr and follow steps above
