# Command Reference

## Raindrop CLI

### Build & Deploy
```bash
raindrop build generate    # Generate types
raindrop build deploy      # Build and deploy
raindrop build deploy --amend  # Resume from previous deployment
```

### Environment Variables
```bash
# List environment variables
raindrop env list

# Set environment variable (from .env file)
source .env && raindrop build deploy  # Loads .env vars into deployment
```

### Application Management
```bash
# View application status
raindrop app list

# View logs
raindrop logs
```

## Vercel CLI

### Deployment
```bash
vercel --prod              # Deploy to production
vercel ls <project>        # List deployments
vercel env ls              # List environment variables
vercel env add <NAME> <env>  # Add environment variable
```

### Build
```bash
npm run build              # Build frontend with Vite
vite build                 # Direct Vite build
```

## Git
```bash
git status
git add .
git commit -m "message"
git push
git branch                 # List branches
git checkout <branch>      # Switch branch
git merge <branch>         # Merge branch
```

## pnpm
```bash
pnpm install               # Install dependencies
pnpm add <package>         # Add package
pnpm run <script>          # Run script
```

## Database (Vultr)
```bash
# Test database connection
curl -X POST https://db.ai-tools-marketplace.io/query \
  -H "Authorization: Bearer $VULTR_DB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT * FROM personas"}'
```

## Testing
```bash
# Test API endpoint
curl -s "https://<api-url>/api/personas"

# Test with verbose output
curl -v "https://<api-url>/api/personas"
```

## Common Workflows

### Deploy Backend + Frontend
```bash
# 1. Build and deploy backend
raindrop build deploy

# 2. Get deployment URL from output
# 3. Update VITE_API_URL in .env with deployment URL

# 4. Build frontend
npm run build

# 5. Deploy frontend
vercel --prod
```

### Fix Stuck Deployment
```bash
# Kill stuck processes
pkill -f "raindrop build deploy"

# Remove sandbox file
rm -f .raindrop/sandbox

# Force fresh deployment
cat > .raindrop/config.json << 'EOF'
{}
EOF
raindrop build deploy
```

### Update Environment Variables
```bash
# Raindrop uses .env file during build/deploy
# Make sure .env is loaded:
source .env
raindrop build deploy
```
