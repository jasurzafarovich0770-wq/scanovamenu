# Deployment Guide

This project is a monorepo with a React frontend and Node.js backend. Here's how to deploy it:

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository with this code

### Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select "Restaurant SaaS" project
   - Configure build settings:
     - **Framework**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

3. **Set Environment Variables**
   In Vercel dashboard, go to Settings → Environment Variables and add:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically deploy on every push to main

## Backend Deployment (Railway or Render)

### Option 1: Railway (Recommended)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Choose your repository

3. **Configure Backend Service**
   - Select the `backend` directory
   - Railway will detect Node.js automatically

4. **Set Environment Variables**
   In Railway dashboard, add:
   ```
   DATABASE_URL=postgresql://user:password@host:port/dbname
   REDIS_URL=redis://user:password@host:port
   JWT_SECRET=your-secret-key-here
   CORS_ORIGINS=https://your-frontend-url.vercel.app
   NODE_ENV=production
   PORT=3000
   ```

5. **Database Setup**
   - Add PostgreSQL plugin in Railway
   - Add Redis plugin in Railway
   - Railway will automatically set DATABASE_URL and REDIS_URL

6. **Deploy**
   - Railway will automatically deploy on every push

### Option 2: Render

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repository

3. **Configure Service**
   - **Name**: restaurant-saas-backend
   - **Root Directory**: backend
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma migrate deploy && npm run build`
   - **Start Command**: `npm start`

4. **Set Environment Variables**
   ```
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   JWT_SECRET=your-secret-key
   CORS_ORIGINS=https://your-frontend-url.vercel.app
   NODE_ENV=production
   ```

5. **Add Database**
   - Create PostgreSQL database on Render
   - Create Redis database on Render
   - Copy connection strings to environment variables

## Database Setup

### PostgreSQL
1. Create a PostgreSQL database on Railway/Render
2. Get the connection string
3. Set as `DATABASE_URL` environment variable
4. Run migrations: `npx prisma migrate deploy`

### Redis
1. Create a Redis instance on Railway/Render
2. Get the connection string
3. Set as `REDIS_URL` environment variable

## Post-Deployment

1. **Update Frontend API URL**
   - Get your backend URL from Railway/Render
   - Update `VITE_API_URL` in Vercel environment variables
   - Redeploy frontend

2. **Test the Application**
   - Visit your Vercel frontend URL
   - Try logging in with demo credentials:
     - Username: `superadmin`
     - Password: `qwertyuiop`

3. **Monitor Logs**
   - Vercel: Deployments → Logs
   - Railway: Logs tab
   - Render: Logs tab

## Troubleshooting

### Frontend not connecting to backend
- Check `VITE_API_URL` environment variable
- Ensure backend CORS includes frontend URL
- Check browser console for errors

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check database is running
- Run migrations: `npx prisma migrate deploy`

### Redis connection errors
- Verify `REDIS_URL` is correct
- Check Redis is running
- Test connection with Redis CLI

## Environment Variables Reference

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@host:port/dbname
REDIS_URL=redis://user:password@host:port
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
CORS_ORIGINS=https://your-frontend-url.vercel.app
NODE_ENV=production
PORT=3000
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend-url.railway.app
```

## Continuous Deployment

Both Vercel and Railway/Render support automatic deployment on push:
1. Push to main branch
2. Services automatically rebuild and deploy
3. Check deployment status in respective dashboards

## Rollback

### Vercel
- Go to Deployments
- Click on previous deployment
- Click "Redeploy"

### Railway/Render
- Go to Deployments
- Select previous deployment
- Click "Redeploy"
