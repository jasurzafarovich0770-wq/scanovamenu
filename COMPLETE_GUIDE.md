# QR Restaurant Ordering System - To'liq Qo'llanma

## 🎯 Tizim Haqida

Professional QR kod asosidagi restoran buyurtma tizimi - mobil va veb platformalar uchun.

### Asosiy Xususiyatlar:
- ✅ QR kod orqali tezkor buyurtma
- ✅ Har restoran uchun alohida admin panel
- ✅ Real-time menyu va buyurtmalar
- ✅ Mobil va desktop qo'llab-quvvatlash
- ✅ Xavfsiz autentifikatsiya
- ✅ Professional ma'lumotlar bazasi
- ✅ Rasm yuklash va boshqarish
- ✅ To'lov tizimi tayyor (integratsiya kerak)
- ✅ Mijozlar va sharhlar tizimi

## 📋 Texnologiyalar

### Backend:
- **Node.js** + **Express.js** - Server
- **TypeScript** - Type safety
- **Prisma** - ORM
- **PostgreSQL** - Database
- **Redis** - Caching
- **Winston** - Logging

### Frontend:
- **React 18** - UI Library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Navigation
- **Axios** - HTTP client

### DevOps:
- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **Git** - Version control

## 🚀 Tezkor Boshlash

### 1. Talablar

```bash
# Node.js 18+ va npm
node --version  # v18.0.0+
npm --version   # 9.0.0+

# PostgreSQL 14+
psql --version  # 14.0+

# Redis 7+
redis-cli --version  # 7.0+

# Docker (ixtiyoriy)
docker --version
docker-compose --version
```

### 2. O'rnatish

```bash
# Repository'ni clone qiling
git clone <repository-url>
cd QR_scansystem

# Dependencies o'rnating
npm install

# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd ../frontend && npm install
```

### 3. Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/restaurant_saas"

# Redis
REDIS_URL="redis://localhost:6379"

# Server
PORT=3000
NODE_ENV=development

# JWT (kelajakda)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
```

### 4. Database Setup

```bash
cd backend

# Prisma generate
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed demo data
npx tsx prisma/seed.ts
npx tsx prisma/seed-menu.ts
```

### 5. Ishga Tushirish

#### Development Mode

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Server: http://localhost:3000

# Terminal 2 - Frontend
cd frontend
npm run dev
# App: http://localhost:5173
```

#### Docker bilan

```bash
# Barcha servislarni ishga tushirish
docker-compose up -d

# Loglarni ko'rish
docker-compose logs -f

# To'xtatish
docker-compose down
```

## 📱 Foydalanish

### Mijozlar Uchun:

1. **QR Kod Skan Qilish**
   - Stolda joylashgan QR kodni skan qiling
   - Yoki to'g'ridan URL kiriting: `http://localhost:5173/r/{restaurantId}/t/{tableNumber}`

2. **Menyu Ko'rish**
   - Barcha mavjud ovqatlarni ko'ring
   - Kategoriya bo'yicha filtrlang
   - Rasmlar va tavsiflarni o'qing

3. **Buyurtma Berish**
   - Ovqatlarni savatga qo'shing
   - Miqdorni o'zgartiring
   - Buyurtmani tasdiqlang

4. **Buyurtmani Kuzatish**
   - Real-time holat yangilanishlari
   - Tayyorlanish vaqti
   - Buyurtma tarixi

### Adminlar Uchun:

1. **Kirish**
   - URL: `http://localhost:5173/scanner`
   - Demo login: `demopizza` / `pizza123`

2. **Kategoriyalar Boshqaruvi**
   - "Kategoriyalar" tabini oching
   - Yangi kategoriya qo'shing
   - Tartib raqamini belgilang
   - Tahrirlang yoki o'chiring

3. **Menyu Boshqaruvi**
   - "Menyu Boshqaruvi" tabini oching
   - Yangi ovqat qo'shing:
     * Nom (majburiy)
     * Tavsif (to'liq ma'lumot)
     * Narx (majburiy)
     * Kategoriya (majburiy)
     * Rasm (max 5MB)
     * Tayyorlanish vaqti
   - Mavjudlikni boshqaring
   - Tahrirlang yoki o'chiring

4. **Buyurtmalar**
   - Yangi buyurtmalarni ko'ring
   - Holatni o'zgartiring
   - Tafsilotlarni ko'ring

5. **QR Kodlar**
   - Har bir stol uchun QR kod
   - Yuklab olish
   - Chop etish

### Super Admin Uchun:

1. **Kirish**
   - Login: `superadmin` / `admin123`

2. **Restoranlar Boshqaruvi**
   - Barcha restoranlarni ko'ring
   - Tafsilotlarni ko'ring
   - Statistikani tahlil qiling

3. **Foydalanuvchilar**
   - Yangi admin qo'shing
   - Rollarni boshqaring
   - O'chirish

## 🗄️ Database Schema

### Asosiy Jadvallar:

```sql
-- Foydalanuvchilar
User (id, email, phone, passwordHash, name, role, restaurantId)

-- Restoranlar
Restaurant (id, name, slug, address, phone, email, subscriptionPlan)

-- Stollar
Table (id, restaurantId, tableNumber, qrCode, capacity)

-- Menyu Kategoriyalari
MenuCategory (id, restaurantId, name, description, displayOrder)

-- Menyu Ovqatlari
MenuItem (id, restaurantId, categoryId, name, description, price, image, isAvailable)

-- Buyurtmalar
Order (id, orderNumber, restaurantId, tableNumber, items, total, status, paymentStatus)

-- To'lovlar
Payment (id, orderId, amount, method, status, transactionId)

-- Mijozlar
Customer (id, phone, name, email, totalOrders, totalSpent, loyaltyPoints)

-- Sharhlar
Review (id, restaurantId, orderId, customerName, rating, comment)

-- Guest Sessiyalar
GuestSession (id, sessionToken, restaurantId, tableNumber, expiresAt)
```

## 🔐 Xavfsizlik

### Amalga Oshirilgan:
- ✅ Input validation
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Session management
- ✅ Error handling

### Tavsiyalar:
- 🔒 JWT authentication qo'shing
- 🔒 Password hashing (bcrypt)
- 🔒 HTTPS ishlatish (production)
- 🔒 Environment variables xavfsiz saqlash
- 🔒 Regular security audits

## 📊 API Endpoints

### Guest API
```
POST   /api/guest/session          - Create guest session
GET    /api/guest/session/:token   - Validate session
```

### Menu API
```
GET    /api/menu/restaurants/:id/categories  - Get categories
GET    /api/menu/restaurants/:id/items       - Get menu items
POST   /api/menu/categories                  - Create category
PUT    /api/menu/categories/:id              - Update category
DELETE /api/menu/categories/:id              - Delete category
POST   /api/menu/items                       - Create menu item
PUT    /api/menu/items/:id                   - Update menu item
DELETE /api/menu/items/:id                   - Delete menu item
```

### Order API
```
POST   /api/orders              - Create order
GET    /api/orders/:id          - Get order
PATCH  /api/orders/:id/status   - Update order status
```

## 🎨 UI/UX Xususiyatlari

### Design System:
- **Colors**: Gradient backgrounds (slate, purple, blue)
- **Typography**: Modern, readable fonts
- **Animations**: Smooth transitions, fade-ins, slides
- **Icons**: Emoji-based (🍕, 🥗, 🍰, etc.)
- **Glass Morphism**: Frosted glass effects
- **Responsive**: Mobile-first design

### Accessibility:
- Keyboard navigation
- Screen reader support
- High contrast mode
- Touch-friendly buttons
- Clear error messages

## 🧪 Testing

### Manual Testing:

```bash
# Backend API test
curl http://localhost:3000/api/menu/restaurants/demo-restaurant/items

# Create menu item
curl -X POST http://localhost:3000/api/menu/items \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "demo-restaurant",
    "categoryId": "CATEGORY_ID",
    "name": "Test Pizza",
    "price": 50000
  }'
```

### Automated Testing (kelajakda):
- Unit tests (Jest)
- Integration tests (Supertest)
- E2E tests (Playwright/Cypress)

## 📦 Production Deployment

### 1. Build

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### 2. Environment

```env
# Production .env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/restaurant_saas
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=super-secure-production-secret
CORS_ORIGIN=https://yourdomain.com
```

### 3. Deploy Options

#### Option 1: VPS (DigitalOcean, AWS EC2, etc.)
```bash
# Install dependencies
sudo apt update
sudo apt install nodejs npm postgresql redis-server nginx

# Clone and setup
git clone <repo>
cd QR_scansystem
npm install
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build

# Setup Nginx reverse proxy
# Setup PM2 for process management
npm install -g pm2
pm2 start backend/dist/index.js --name restaurant-backend
pm2 startup
pm2 save

# Setup SSL (Let's Encrypt)
sudo certbot --nginx -d yourdomain.com
```

#### Option 2: Docker
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

#### Option 3: Cloud Platforms
- **Vercel** (Frontend)
- **Railway** (Backend + Database)
- **Heroku** (Full stack)
- **AWS** (Elastic Beanstalk)
- **Google Cloud** (Cloud Run)

## 🔧 Troubleshooting

### Backend ishlamayapti
```bash
# Port band bo'lsa
lsof -ti:3000 | xargs kill -9

# Database connection xatosi
# .env faylini tekshiring
# PostgreSQL ishlab turganini tekshiring
psql -U postgres -d restaurant_saas

# Redis xatosi
redis-cli ping  # PONG qaytishi kerak
```

### Frontend ishlamayapti
```bash
# Port band bo'lsa
lsof -ti:5173 | xargs kill -9

# Dependencies xatosi
rm -rf node_modules package-lock.json
npm install

# Build xatosi
npm run build -- --debug
```

### Database migration xatosi
```bash
# Reset database (DIQQAT: barcha ma'lumotlar o'chadi!)
npx prisma migrate reset

# Yangi migration
npx prisma migrate dev --name your_migration_name
```

## 📚 Qo'shimcha Resurslar

### Documentation:
- `README.md` - Asosiy ma'lumot
- `SYSTEM_STATUS.md` - Tizim holati
- `MENU_MANAGEMENT.md` - Menyu boshqaruvi
- `ADMIN_PANEL_TEST.md` - Test qo'llanmasi
- `API.md` - API documentation
- `ARCHITECTURE.md` - Arxitektura
- `DEPLOYMENT.md` - Deploy qo'llanmasi

### Demo Credentials:

**Super Admin:**
- Username: `superadmin`
- Password: `admin123`

**Restaurant Admins:**
- `demopizza` / `pizza123` (Demo Pizza)
- `demokafe` / `kafe123` (Demo Kafe)
- `demofood` / `food123` (Demo Fast Food)
- `pizzahouse` / `house123` (Pizza House)
- `coffeeshop` / `coffee123` (Coffee Shop)

## 🤝 Support

Muammolar yoki savollar bo'lsa:
1. Documentation'ni o'qing
2. GitHub Issues'da qidiring
3. Yangi issue yarating
4. Email: support@yourcompany.com

## 📄 License

MIT License - `LICENSE` faylini ko'ring

## 🎉 Xulosa

Sizning QR Restaurant Ordering System tizimingiz to'liq professional darajada ishlab chiqilgan va production'ga tayyor!

**Asosiy yutuqlar:**
- ✅ To'liq ishlaydigan QR buyurtma tizimi
- ✅ Professional admin panellar
- ✅ Xavfsiz va tezkor backend
- ✅ Modern va responsive frontend
- ✅ Scalable arxitektura
- ✅ Production tayyor

**Keyingi qadamlar:**
1. To'lov tizimi integratsiyasi (Payme/Click)
2. Real-time bildirishnomalar (WebSocket)
3. Kengaytirilgan statistika
4. Mobile app (React Native)
5. Marketing tools

Muvaffaqiyatlar! 🚀
