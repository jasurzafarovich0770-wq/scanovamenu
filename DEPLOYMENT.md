# Deployment Guide

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (optional)

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Setup Database

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 4. Start Services

```bash
# Start all services
npm run dev

# Or individually
npm run dev:backend  # Port 3000
npm run dev:frontend # Port 5173
```

## Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Cloud Deployment

### AWS (Recommended)

**Services:**
- ECS/Fargate for containers
- RDS PostgreSQL
- ElastiCache Redis
- ALB for load balancing
- CloudFront for CDN
- S3 for static assets

**Steps:**

1. Create RDS PostgreSQL instance
2. Create ElastiCache Redis cluster
3. Build and push Docker images to ECR
4. Deploy ECS services
5. Configure ALB with SSL
6. Setup CloudFront distribution

### Environment Variables (Production)

```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/db
REDIS_URL=redis://elasticache-endpoint:6379
JWT_SECRET=<strong-random-secret>
STRIPE_SECRET_KEY=sk_live_xxx
FRONTEND_URL=https://yourdomain.com
```

## Database Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply to production
npx prisma migrate deploy
```

## Monitoring

### Health Checks

- Backend: `GET /health`
- Database: Connection pool status
- Redis: Ping command

### Logging

- Application logs: Winston
- Access logs: Morgan
- Error tracking: Sentry (recommended)

### Metrics

- Request rate
- Response time
- Error rate
- Database query performance

## Scaling

### Horizontal Scaling

- Run multiple backend instances
- Use Redis for shared sessions
- Database connection pooling

### Database Scaling

- Read replicas for queries
- Connection pooling (PgBouncer)
- Query optimization

### Caching Strategy

- Menu data: 5 minutes
- Restaurant data: 15 minutes
- Session data: Redis

## Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set secure JWT secret
- [ ] Enable rate limiting
- [ ] Setup firewall rules
- [ ] Regular security updates
- [ ] Database backups
- [ ] Secrets management (AWS Secrets Manager)

## Backup Strategy

### Database
- Automated daily backups
- Point-in-time recovery
- Cross-region replication

### Redis
- RDB snapshots
- AOF persistence

## Cost Optimization

### AWS Estimated Costs (10,000 daily users)

- ECS Fargate: $50-100/mo
- RDS PostgreSQL: $100-200/mo
- ElastiCache Redis: $50-100/mo
- ALB: $20-30/mo
- CloudFront: $10-50/mo
- **Total: ~$250-500/mo**

### Optimization Tips

- Use reserved instances
- Enable auto-scaling
- Optimize database queries
- Implement caching
- Use CDN for static assets
