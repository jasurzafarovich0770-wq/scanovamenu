# Quick Deployment Guide

Deploy this project to Vercel (frontend) and Railway (backend) in 10 minutes.

## Prerequisites
- GitHub account with this repository
- Vercel account (free at https://vercel.com)
- Railway account (free at https://railway.app)

## Step 1: Deploy Frontend to Vercel (2 minutes)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Paste your GitHub repository URL
4. Click "Import"
5. Configure:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Click "Deploy"
7. Wait for deployment (usually 1-2 minutes)
8. Copy your Vercel URL (e.g., `https://restaurant-saas.vercel.app`)

## Step 2: Deploy Backend to Railway (5 minutes)

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Choose your repository
5. Select `backend` directory
6. Railway will auto-detect Node.js
7. Add services:
   - Click "Add Service" → PostgreSQL
   - Click "Add Service" → Redis
8. Set environment variables:
   - `JWT_SECRET`: Generate a random string (e.g., `openssl rand -base64 32`)
   - `CORS_ORIGINS`: Your Vercel URL from Step 1
   - `NODE_ENV`: `production`
9. Click "Deploy"
10. Wait for deployment (usually 2-3 minutes)
11. Copy your Railway URL from the service details

## Step 3: Connect Frontend to Backend (1 minute)

1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add/Update `VITE_API_URL`:
   - Value: Your Railway backend URL (e.g., `https://railway-app.up.railway.app`)
5. Click "Save"
6. Go to Deployments
7. Click "Redeploy" on the latest deployment

## Step 4: Test (2 minutes)

1. Visit your Vercel URL
2. Login with:
   - Username: `superadmin`
   - Password: `qwertyuiop`
3. Try loading the menu
4. Try creating an order

## Done! 🎉

Your application is now live on:
- **Frontend**: https://your-vercel-url.vercel.app
- **Backend**: https://your-railway-url.up.railway.app

## Troubleshooting

### "Cannot connect to API"
- Check `VITE_API_URL` in Vercel environment variables
- Redeploy frontend after updating URL
- Wait 1-2 minutes for changes to take effect

### "Database connection error"
- Check Railway PostgreSQL is running
- Verify `DATABASE_URL` in Railway environment
- Check Railway logs for errors

### "Build failed"
- Check build logs in Vercel/Railway dashboard
- Ensure all dependencies are installed
- Verify Node version is 18.x

## Next Steps

1. **Custom Domain**
   - Vercel: Settings → Domains → Add custom domain
   - Railway: Settings → Custom Domain

2. **SSL Certificate**
   - Automatic on both Vercel and Railway

3. **Monitoring**
   - Vercel: Analytics tab
   - Railway: Metrics tab

4. **Backups**
   - Railway: Automatic daily backups for PostgreSQL

## Support

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Project Issues: Check GitHub issues

## Environment Variables Reference

### Backend (Railway)
```
DATABASE_URL=postgresql://...  (auto-set by PostgreSQL plugin)
REDIS_URL=redis://...          (auto-set by Redis plugin)
JWT_SECRET=your-secret-key
CORS_ORIGINS=https://your-vercel-url.vercel.app
NODE_ENV=production
PORT=3000
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-railway-url.up.railway.app
```
