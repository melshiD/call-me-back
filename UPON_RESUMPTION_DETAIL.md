Vultr Instance & HTTPS Configuration Summary

Instance:

IP: 144.202.15.249

OS: Ubuntu (root access via SSH key ~/.ssh/vultr_cmb)

Objective

Expose a local app running on port 3000 over HTTPS using a self-signed certificate (quick hackathon setup).

Steps Completed

Nginx installed successfully (apt install nginx -y).

Self-signed SSL certificate generated at:

/etc/ssl/private/nginx-selfsigned.key

/etc/ssl/certs/nginx-selfsigned.crt

Nginx site config created (/etc/nginx/sites-available/db-api) to proxy traffic from HTTPS → localhost:3000.

Configuration syntax verified (nginx -t): ✅ syntax OK.

Nginx service failed to start, with the following log entries:

bind() to 0.0.0.0:443 failed (98)
bind() to 0.0.0.0:80 failed (98)


→ Meaning both ports 80 and 443 were already in use.

Root Cause

Running sudo lsof -i :80 -i :443 revealed:

caddy 18574 caddy TCP *:https (LISTEN)
caddy 18574 caddy TCP *:http (LISTEN)


Caddy is already bound to both HTTP and HTTPS ports.
This is likely part of the existing API service running on the instance (it uses Caddy as a reverse proxy and certificate manager).

What We Learned

Caddy currently owns ports 80 and 443 and handles HTTPS for the server.

Nginx cannot start while those ports are occupied.

The self-signed certificate configuration works, but it must run on alternate ports or replace Caddy.

Disabling Caddy could break the existing database API.

Recommended Next Steps

Option 1 (Preferred): Keep Caddy and integrate the new app into its config
Edit /etc/caddy/Caddyfile:

https://144.202.15.249 {
    reverse_proxy localhost:3000
}


Then reload:

systemctl reload caddy


Option 2: Use Nginx on alternate ports (e.g., 8080/8443)
Update /etc/nginx/sites-available/db-api:

listen 8443 ssl;
ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
proxy_pass http://localhost:3000;


Option 3: Only disable Caddy if it’s confirmed unused by the API:

systemctl stop caddy
systemctl disable caddy
systemctl start nginx


Summary:

Nginx config and SSL setup are correct, but Caddy is already managing HTTPS on this server. We can either proxy our new app through Caddy (recommended), change Nginx to alternate ports, or remove Caddy if it’s no longer needed.