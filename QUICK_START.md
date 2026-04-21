# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites Check
```bash
node --version  # Should be 20+
docker --version  # Optional but recommended
```

### One-Command Setup
```bash
./setup.sh && npm run dev
```

That's it! 🎉

## 📍 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | Customer app |
| Backend API | http://localhost:3000 | REST API |
| Health Check | http://localhost:3000/health | System status |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |

## 🧪 Test the System

### 1. Create a Guest Session

Open browser:
```
http://localhost:5173/r/test-restaurant/t/5
```

You should see:
- "Welcome! Table 5"
- Auto-redirect to menu

### 2. Check Session Token

Open browser console:
```javascript
localStorage.getItem('guestToken')
// Should return a UUID
```

### 3. Test API Directly

```bash
# Create session
curl -X POST http://localhost:3000/api/guest/session \
  -H "Content-Type: application/json" \
  -d '{"restaurantId":"test","tableNumber":"5"}'

# Save the token from response, then:
export TOKEN="your-token-here"

# Place order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "x-guest-token: $TOKEN" \
  -d '{
    "items": [
      {"menuItemId":"1","name":"Burger","price":12.99,"quantity":2}
    ],
    "paymentMethod": "CASH"
  }'
```

## 🔧 Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Database Connection Failed
```bash
# Restart database
docker-compose restart postgres

# Check if running
docker ps | grep postgres
```

### Redis Connection Failed
```bash
# Restart Redis
docker-compose restart redis

# Test connection
docker exec -it restaurant-saas-redis redis-cli ping
```

### Prisma Issues
```bash
cd backend
npx prisma generate
npx prisma migrate reset
```

## 📁 Project Structure

```
restaurant-saas/
├── backend/
│   ├── src/
│   │   ├── domain/          # Business logic
│   │   │   ├── repositories/  # Data interfaces
│   │   │   └── services/      # Use cases
│   │   ├── infrastructure/  # External services
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── repositories/
│   │   ├── api/            # HTTP layer
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   └── middleware/
│   │   └── config/
│   └── prisma/
│       └── schema.prisma
├── frontend/
│   └── src/
│       ├── pages/          # React pages
│       ├── store/          # State management
│       └── lib/            # Utilities
└── shared/
    └── src/
        └── types/          # Shared TypeScript types
```

## 🎯 Key Files to Know

| File | Purpose |
|------|---------|
| `backend/prisma/schema.prisma` | Database schema |
| `backend/src/domain/services/` | Business logic |
| `backend/src/api/routes/` | API endpoints |
| `frontend/src/pages/QRLanding.tsx` | QR entry point |
| `frontend/src/store/useGuestStore.ts` | Session state |
| `shared/src/types/index.ts` | Type definitions |

## 🔑 Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://restaurant:restaurant123@localhost:5432/restaurant_saas
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
PORT=3000
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3000/api
```

## 📊 Database Quick Commands

```bash
# Open Prisma Studio (GUI)
cd backend && npx prisma studio

# Create migration
npx prisma migrate dev --name your_migration_name

# Reset database
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

## 🐛 Debug Mode

### Backend Logs
```bash
# Set log level
export LOG_LEVEL=debug

# Watch logs
npm run dev:backend | grep ERROR
```

### Frontend Logs
```bash
# Open browser console
# Check Network tab for API calls
# Check Application > Local Storage for session
```

## 📚 Next Steps

1. **Read Documentation**
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System design
   - [API.md](API.md) - API reference
   - [SECURITY.md](SECURITY.md) - Security details

2. **Customize**
   - Add menu items to database
   - Create restaurant records
   - Configure branding

3. **Deploy**
   - See [DEPLOYMENT.md](DEPLOYMENT.md)
   - Setup AWS infrastructure
   - Configure domain & SSL

## 💡 Pro Tips

### Development Workflow
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend

# Terminal 3: Database GUI
cd backend && npx prisma studio
```

### Hot Reload
- Backend: Auto-reloads on file changes (tsx watch)
- Frontend: Auto-reloads on file changes (Vite HMR)

### API Testing
Use tools like:
- Postman
- Insomnia
- Thunder Client (VS Code)
- cURL (command line)

### Database Inspection
```bash
# Connect to PostgreSQL
docker exec -it restaurant-saas-postgres psql -U restaurant -d restaurant_saas

# List tables
\dt

# Describe table
\d "Order"

# Query
SELECT * FROM "Order" LIMIT 5;
```

## 🎓 Learning Path

1. **Understand the Flow**
   - QR scan → Session creation → Order placement
   - Read `frontend/src/pages/QRLanding.tsx`
   - Read `backend/src/domain/services/GuestSessionService.ts`

2. **Explore the API**
   - Test endpoints with cURL
   - Read `backend/src/api/routes/`
   - Check `API.md` for examples

3. **Modify the Code**
   - Add a new menu field
   - Create a new API endpoint
   - Add a frontend feature

4. **Deploy**
   - Follow `DEPLOYMENT.md`
   - Setup production environment
   - Monitor and optimize

## 🆘 Get Help

- Check [TESTING.md](TESTING.md) for test examples
- Review error logs in console
- Check database with Prisma Studio
- Verify Redis connection
- Test API with cURL

## ✅ Verification Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] PostgreSQL accessible
- [ ] Redis accessible
- [ ] Health check returns OK
- [ ] Can create guest session
- [ ] Can place order
- [ ] Session stored in localStorage

If all checked, you're ready to develop! 🚀
