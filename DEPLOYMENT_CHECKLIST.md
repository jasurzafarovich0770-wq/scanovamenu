# Deployment Checklist

## Pre-Deployment

- [ ] All code committed to GitHub
- [ ] Environment variables documented
- [ ] Database migrations tested locally
- [ ] Frontend builds successfully: `npm run build --workspace=frontend`
- [ ] Backend builds successfully: `npm run build --workspace=backend`
- [ ] Tests pass: `npm test`

## Frontend Deployment (Vercel)

### Step 1: Connect Repository
- [ ] Go to https://vercel.com/new
- [ ] Import your GitHub repository
- [ ] Select "Restaurant SaaS" project

### Step 2: Configure Build Settings
- [ ] Framework: Vite
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`

### Step 3: Environment Variables
- [ ] Add `VITE_API_URL` (will update after backend deployment)
- [ ] Set to: `http://localhost:3000` for now

### Step 4: Deploy
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Note the Vercel URL (e.g., `https://restaurant-saas.vercel.app`)

## Backend Deployment (Railway)

### Step 1: Create Railway Account
- [ ] Go to https://railway.app
- [ ] Sign up with GitHub
- [ ] Authorize Railway to access your repositories

### Step 2: Create New Project
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub"
- [ ] Choose your repository
- [ ] Select `backend` directory

### Step 3: Add Services
- [ ] Add PostgreSQL plugin
  - [ ] Note the `DATABASE_URL`
- [ ] Add Redis plugin
  - [ ] Note the `REDIS_URL`

### Step 4: Configure Environment Variables
In Railway dashboard, add:
- [ ] `DATABASE_URL` (from PostgreSQL plugin)
- [ ] `REDIS_URL` (from Redis plugin)
- [ ] `JWT_SECRET` (generate a strong random string)
- [ ] `CORS_ORIGINS` (set to your Vercel frontend URL)
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3000`

### Step 5: Deploy
- [ ] Railway will automatically build and deploy
- [ ] Check deployment logs for errors
- [ ] Note the Railway backend URL (e.g., `https://railway-app.up.railway.app`)

## Post-Deployment Configuration

### Step 1: Update Frontend API URL
- [ ] Go to Vercel dashboard
- [ ] Settings → Environment Variables
- [ ] Update `VITE_API_URL` to your Railway backend URL
- [ ] Redeploy frontend

### Step 2: Test Application
- [ ] Visit your Vercel frontend URL
- [ ] Try logging in:
  - Username: `superadmin`
  - Password: `qwertyuiop`
- [ ] Test menu loading
- [ ] Test creating orders

### Step 3: Monitor Logs
- [ ] Vercel: Check deployment logs
- [ ] Railway: Check service logs
- [ ] Look for any errors or warnings

## Troubleshooting

### Frontend shows "Cannot connect to API"
- [ ] Check `VITE_API_URL` in Vercel environment variables
- [ ] Verify backend is running on Railway
- [ ] Check CORS settings in backend
- [ ] Redeploy frontend after updating URL

### Database connection error
- [ ] Verify `DATABASE_URL` is correct
- [ ] Check PostgreSQL is running on Railway
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Check Railway logs for errors

### Redis connection error
- [ ] Verify `REDIS_URL` is correct
- [ ] Check Redis is running on Railway
- [ ] Restart Redis service

### Build fails on Railway
- [ ] Check build logs in Railway dashboard
- [ ] Verify all dependencies are in package.json
- [ ] Ensure Node version is compatible (18.x)
- [ ] Check for TypeScript compilation errors

## Rollback Plan

### If Frontend Deployment Fails
1. Go to Vercel Deployments
2. Find the last successful deployment
3. Click "Redeploy"

### If Backend Deployment Fails
1. Go to Railway Deployments
2. Find the last successful deployment
3. Click "Redeploy"

## Monitoring

### Daily Checks
- [ ] Frontend loads without errors
- [ ] Backend API responds
- [ ] Database queries work
- [ ] Redis cache works

### Weekly Checks
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Verify backups are working
- [ ] Update dependencies if needed

## Security Checklist

- [ ] JWT_SECRET is strong and random
- [ ] Database password is strong
- [ ] CORS_ORIGINS only includes your domain
- [ ] Environment variables are not in code
- [ ] Sensitive data is not logged
- [ ] HTTPS is enabled (automatic on Vercel/Railway)

## Performance Optimization

- [ ] Frontend is minified and optimized
- [ ] Database indexes are created
- [ ] Redis caching is enabled
- [ ] CDN is configured (Vercel default)
- [ ] Images are optimized

## Backup Strategy

- [ ] Database backups are automated
- [ ] Backups are tested regularly
- [ ] Backup retention policy is set
- [ ] Disaster recovery plan is documented

## Documentation

- [ ] Deployment guide is updated
- [ ] Environment variables are documented
- [ ] API endpoints are documented
- [ ] Database schema is documented
- [ ] Troubleshooting guide is updated
