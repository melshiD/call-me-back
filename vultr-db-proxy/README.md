# Vultr Database Proxy

A secure PostgreSQL API proxy for the Call Me Back application. This service runs on Vultr and provides HTTP access to PostgreSQL while keeping the database on localhost.

## Architecture

```
Raindrop Workers → HTTPS + API Key → Express Proxy → PostgreSQL (localhost)
```

## Features

- ✅ PostgreSQL on localhost only (secure)
- ✅ API key authentication
- ✅ Parameterized queries (SQL injection protection)
- ✅ Health check endpoint
- ✅ Batch query support for migrations
- ✅ PM2 process management
- ✅ Auto-restart on failure

## Deployment

### Prerequisites

- Vultr compute instance (Ubuntu 22.04)
- Root access via SSH

### Quick Deploy

```bash
# 1. Copy files to Vultr instance
scp -r vultr-db-proxy/ root@YOUR_VULTR_IP:/opt/

# 2. SSH into instance
ssh root@YOUR_VULTR_IP

# 3. Configure environment
cd /opt/vultr-db-proxy
cp .env.example .env
nano .env  # Edit configuration

# 4. Generate API key
openssl rand -hex 32  # Copy this to .env as API_KEY

# 5. Run deployment script
chmod +x deploy.sh
sudo ./deploy.sh

# 6. Verify service
curl http://localhost:3000/health
pm2 status
```

### Manual Setup

If the automated script doesn't work:

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Configure PostgreSQL
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: listen_addresses = 'localhost'
sudo systemctl restart postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE call_me_back;
CREATE USER cmb_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE call_me_back TO cmb_user;
\q

# Install dependencies and start
npm install --production
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## API Endpoints

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-01-13T..."
}
```

### Query Endpoint
```http
POST /query
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "sql": "SELECT * FROM personas WHERE is_active = $1",
  "params": [true]
}
```

Response:
```json
{
  "rows": [...],
  "rowCount": 3,
  "command": "SELECT"
}
```

### Batch Query (for migrations)
```http
POST /batch
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "queries": [
    { "sql": "CREATE TABLE...", "params": [] },
    { "sql": "INSERT INTO...", "params": ["value"] }
  ]
}
```

## Management

```bash
# View logs
pm2 logs db-proxy

# Restart service
pm2 restart db-proxy

# Stop service
pm2 stop db-proxy

# View status
pm2 status

# Monitor
pm2 monit
```

## Security

- PostgreSQL listens on `127.0.0.1` only
- API key required for all query endpoints
- Parameterized queries prevent SQL injection
- Health check is the only unauthenticated endpoint
- Consider adding rate limiting in production

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `call_me_back` |
| `DB_USER` | Database user | required |
| `DB_PASSWORD` | Database password | required |
| `API_KEY` | API authentication key | required |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |

## Troubleshooting

### Can't connect to PostgreSQL
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Verify user can connect
psql -h localhost -U cmb_user -d call_me_back
```

### Service won't start
```bash
# Check PM2 logs
pm2 logs db-proxy --lines 50

# Check if port is in use
sudo lsof -i :3000
```

### API key issues
```bash
# Regenerate API key
openssl rand -hex 32

# Update .env and restart
nano .env
pm2 restart db-proxy
```
