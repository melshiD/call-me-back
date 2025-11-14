#!/bin/bash
set -e

echo "🚀 Deploying Vultr DB Proxy..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (use sudo)${NC}"
  exit 1
fi

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt-get update -qq
apt-get upgrade -y -qq

# Install Node.js 18.x
echo -e "${YELLOW}Installing Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PostgreSQL 14
echo -e "${YELLOW}Installing PostgreSQL 14...${NC}"
apt-get install -y postgresql postgresql-contrib

# Install PM2 globally
echo -e "${YELLOW}Installing PM2...${NC}"
npm install -g pm2

# Create logs directory
mkdir -p logs

# Check if .env exists
if [ ! -f .env ]; then
  echo -e "${RED}ERROR: .env file not found!${NC}"
  echo -e "${YELLOW}Please copy .env.example to .env and configure it:${NC}"
  echo "  cp .env.example .env"
  echo "  nano .env"
  exit 1
fi

# Load environment variables
source .env

# Configure PostgreSQL
echo -e "${YELLOW}Configuring PostgreSQL...${NC}"

# Ensure PostgreSQL listens only on localhost
PG_VERSION=$(ls /etc/postgresql/)
PG_CONF="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/g" $PG_CONF

# Restart PostgreSQL
systemctl restart postgresql

# Create database and user
echo -e "${YELLOW}Setting up database...${NC}"
sudo -u postgres psql <<EOF
-- Create database if it doesn't exist
SELECT 'CREATE DATABASE ${DB_NAME}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec

-- Create user if it doesn't exist
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '${DB_USER}') THEN
    CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
EOF

echo -e "${GREEN}✓ Database configured${NC}"

# Install Node dependencies
echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
npm install --production

# Setup PM2 startup
echo -e "${YELLOW}Configuring PM2 startup...${NC}"
pm2 startup systemd -u root --hp /root

# Start the service
echo -e "${YELLOW}Starting service with PM2...${NC}"
pm2 delete db-proxy 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Configure firewall (if ufw is available)
if command -v ufw &> /dev/null; then
  echo -e "${YELLOW}Configuring firewall...${NC}"
  ufw allow ${PORT}/tcp
  echo -e "${GREEN}✓ Firewall configured (port ${PORT} open)${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Service status:"
pm2 status
echo ""
echo -e "Logs: ${YELLOW}pm2 logs db-proxy${NC}"
echo -e "Restart: ${YELLOW}pm2 restart db-proxy${NC}"
echo -e "Stop: ${YELLOW}pm2 stop db-proxy${NC}"
echo ""
echo -e "Health check: ${YELLOW}curl http://localhost:${PORT}/health${NC}"
echo ""
