# Troubleshooting Guide

Common issues and solutions for the Restaurant SaaS system.

## Installation Issues

### Node.js Version Error
```
Error: The engine "node" is incompatible
```

**Solution:**
```bash
# Check version
node --version

# Should be 20+
# Install Node 20: https://nodejs.org/
```

### npm install fails
```
Error: EACCES: permission denied
```

**Solution:**
```bash
# Don't use sudo, fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

## Database Issues

### Connection refused
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Or check if running
docker ps | grep postgres

# Check logs
docker logs restaurant-saas-postgres
```

### Migration failed
```
Error: P1001: Can't reach database server
```

**Solution:**
```bash
# Wait for database to be ready
sleep 5

# Run migrations again
cd backend
npx prisma migrate dev

# If still fails, reset
npx prisma migrate reset
```

### Prisma Client not generated
```
Error: @prisma/client did not initialize yet
```

**Solution:**
```bash
cd backend
npx prisma generate
```

## Redis Issues

### Redis connection failed
```
Error: Redis connection to localhost:6379 failed
```

**Solution:**
```bash
# Start Redis
docker-compose up -d redis

# Test connection
docker exec -it restaurant-saas-redis redis-cli ping
# Should return: PONG
```

## Backend Issues

### Port already in use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill it
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev:backend
```

### Environment variables not loaded
```
Error: JWT_SECRET is not defined
```

**Solution:**
```bash
# Check .env file exists
ls backend/.env

# If not, create it
cp backend/.env.example backend/.env

# Edit with your values
nano backend/.env
```

### TypeScript compilation errors
```
Error: Cannot find module '@restaurant-saas/shared'
```

**Solution:**
```bash
# Build shared package first
npm run build --workspace=shared

# Or install all dependencies
npm install
```

## Frontend Issues

### Vite dev server won't start
```
Error: Port 5173 is already in use
```

**Solution:**
```bash
# Kill process
lsof -ti:5173 | xargs kill -9

# Or use different port
vite --port 5174
```

### API calls failing
```
Error: Network Error
```

**Solution:**
```bash
# Check backend is running
curl http://localhost:3000/health

# Check CORS settings
# Verify FRONTEND_URL in backend/.env

# Check API URL in frontend
cat frontend/.env
# Should have: VITE_API_URL=http://localhost:3000/api
```

### Session token not working
```
Error: 401 Unauthorized
```

**Solution:**
```javascript
// Check localStorage
localStorage.getItem('guestToken')

// If null, scan QR again
// Or clear and recreate
localStorage.clear()
window.location.href = '/r/restaurant-id/t/5'
```

## Runtime Issues

### Session expired
```
Error: Session expired
```

**Solution:**
- Sessions expire after 24 hours
- Scan QR code again to create new session
- Or adjust GUEST_SESSION_DURATION in code

### Rate limit exceeded
```
Error: Order rate limit exceeded
```

**Solution:**
- Wait 1 hour (limit is 5 orders/hour)
- Or adjust ORDER_RATE_LIMIT in shared/src/constants/

### Order not updating
```
Order status stuck on PENDING
```

**Solution:**
```bash
# Check order in database
docker exec -it restaurant-saas-postgres psql -U restaurant -d restaurant_saas

# Query order
SELECT * FROM "Order" WHERE id = 'order-id';

# Update manually if needed
UPDATE "Order" SET status = 'PREPARING' WHERE id = 'order-id';
```

## Docker Issues

### Container won't start
```
Error: Container exited with code 1
```

**Solution:**
```bash
# Check logs
docker logs restaurant-saas-backend

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Volume permission issues
```
Error: Permission denied
```

**Solution:**
```bash
# Fix permissions
sudo chown -R $USER:$USER .

# Or remove volumes and recreate
docker-compose down -v
docker-compose up -d
```

## Performance Issues

### Slow API responses
```
Response time > 1 second
```

**Solution:**
```bash
# Check database queries
# Look for "Slow query" in logs
docker logs restaurant-saas-backend | grep "Slow query"

# Add indexes if needed
# Check ARCHITECTURE.md for index recommendations

# Check Redis connection
docker exec -it restaurant-saas-redis redis-cli ping
```

### High memory usage
```
Memory usage > 1GB
```

**Solution:**
```bash
# Check Node.js memory
docker stats restaurant-saas-backend

# Increase limit if needed
NODE_OPTIONS=--max-old-space-size=2048 npm run dev

# Or optimize queries
```

## Testing Issues

### Tests failing
```
Error: Cannot connect to test database
```

**Solution:**
```bash
# Use separate test database
DATABASE_URL="postgresql://restaurant:restaurant123@localhost:5432/restaurant_saas_test"

# Run migrations
npx prisma migrate deploy

# Run tests
npm test
```

## Production Issues

### SSL certificate errors
```
Error: unable to verify the first certificate
```

**Solution:**
- Ensure SSL certificate is valid
- Check certificate chain
- Use Let's Encrypt for free SSL

### CORS errors in production
```
Error: CORS policy blocked
```

**Solution:**
```bash
# Update backend/.env
FRONTEND_URL=https://yourdomain.com

# Restart backend
docker-compose restart backend
```

### Database connection pool exhausted
```
Error: Connection pool timeout
```

**Solution:**
```prisma
// Increase pool size in schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  pool_size = 20
}
```

## Debugging Tips

### Enable debug logging
```bash
# Backend
LOG_LEVEL=debug npm run dev:backend

# Frontend
# Open browser console
# Check Network tab
```

### Check system health
```bash
# Backend health
curl http://localhost:3000/health

# Database
docker exec -it restaurant-saas-postgres pg_isready

# Redis
docker exec -it restaurant-saas-redis redis-cli ping
```

### Inspect database
```bash
# Open Prisma Studio
cd backend
npx prisma studio

# Or use psql
docker exec -it restaurant-saas-postgres psql -U restaurant -d restaurant_saas
```

### Monitor logs
```bash
# Backend logs
docker logs -f restaurant-saas-backend

# Database logs
docker logs -f restaurant-saas-postgres

# All logs
docker-compose logs -f
```

## Getting Help

If you're still stuck:

1. Check [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
2. Search existing GitHub issues
3. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details
   - Logs

## Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request body |
| 401 | Unauthorized | Check session token |
| 404 | Not Found | Check URL/ID |
| 429 | Too Many Requests | Wait and retry |
| 500 | Server Error | Check logs |

## Quick Fixes

```bash
# Nuclear option: Reset everything
docker-compose down -v
rm -rf node_modules
npm install
./setup.sh
npm run dev
```

## Prevention

- Always use `.env` files
- Keep dependencies updated
- Run tests before deploying
- Monitor logs regularly
- Backup database regularly
