#!/bin/bash
set -e

echo "Setting up HTTPS with Caddy..."

# Install Caddy
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy -y

# Create Caddyfile
cat > /etc/caddy/Caddyfile << 'EOF'
# Reverse proxy for database API
:443 {
    reverse_proxy localhost:3000
    tls internal
}

# HTTP redirect (optional)
:80 {
    redir https://{host}{uri}
}
EOF

# Restart Caddy
systemctl reload caddy

echo "✓ HTTPS setup complete!"
echo "API now available at: https://144.202.15.249"
