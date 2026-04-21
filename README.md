# Restaurant Management & QR Ordering SaaS

Production-level multi-tenant restaurant management system with **guest-first QR ordering**. Built with Clean Architecture principles for scalability and maintainability.

## 🎯 Core Philosophy

**Customers scan QR → Order immediately → No registration required**

This system prioritizes guest experience by eliminating friction. Registration is optional for loyalty benefits, never mandatory for ordering.

## 🏗️ Architecture

```
restaurant-saas/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── domain/      # Business logic (framework-agnostic)
│   │   ├── infrastructure/  # Database, Redis, external services
│   │   ├── api/         # Controllers, routes, middleware
│   │   └── config/      # Configuration
│   └── prisma/          # Database schema & migrations
├── frontend/            # React customer app
│   ├── src/
│   │   ├── pages/       # QR landing, menu, cart, tracking
│   │   ├── store/       # Zustand state management
│   │   └── lib/         # API client
├── admin/               # React admin dashboard (future)
├── shared/              # Shared TypeScript types
└── infrastructure/      # Docker, deployment configs
```

## ✨ Key Features

### Guest-First Ordering
- ✅ QR code scanning with automatic session creation
- ✅ No login/registration required
- ✅ Temporary 24-hour sessions
- ✅ Privacy-focused (minimal data collection)
- ✅ Rate limiting (5 orders/hour per session)

### Multi-Tenancy SaaS
- ✅ Restaurant-level data isolation
- ✅ Subscription plans (FREE, STARTER, PRO, ENTERPRISE)
- ✅ Resource limits per plan
- ✅ Scalable to 10,000+ daily users

### Order Management
- ✅ Real-time order tracking
- ✅ Status updates (Pending → Preparing → Ready → Served)
- ✅ Guest and registered user orders
- ✅ Table-based organization

### Security & Performance
- ✅ Clean Architecture (domain-driven design)
- ✅ Rate limiting & input validation
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection (Helmet.js)
- ✅ Redis caching for sessions
- ✅ Database indexing on hot paths

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16+ with Prisma ORM
- **Cache**: Redis 7+
- **Validation**: Zod
- **Logging**: Winston

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State**: Zustand
- **HTTP**: Axios
- **Build**: Vite

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Deployment**: AWS ECS/Fargate (recommended)
- **CDN**: CloudFront
- **Monitoring**: Winston + CloudWatch

## 🚀 Quick Start

### Automated Setup

```bash
# Run setup script
./setup.sh

# Start all services
npm run dev
```

### Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start database (Docker)
docker-compose up -d postgres redis

# 4. Run migrations
cd backend
npx prisma generate
npx prisma migrate dev
cd ..

# 5. Start services
npm run dev
```

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 📱 User Flow

### Guest Ordering Flow

1. **Scan QR Code**
   ```
   https://app.com/r/{restaurantId}/t/{tableNumber}
   ```

2. **Auto Session Creation**
   - System detects restaurant & table
   - Creates temporary guest session
   - Stores token in localStorage
   - No login required

3. **Browse & Order**
   - View menu
   - Add items to cart
   - Place order with one click

4. **Track Order**
   - Real-time status updates
   - Estimated preparation time
   - Live notifications

5. **Session Expiry**
   - Auto-expires after 24 hours
   - Or when table is closed by staff

## 🔐 Security Features

### Guest Session Security
- UUID v4 tokens (unpredictable)
- IP address tracking
- User agent validation
- Automatic expiration
- Rate limiting per session

### API Security
- Helmet.js security headers
- CORS configuration
- Input validation (Zod)
- SQL injection prevention (Prisma)
- XSS protection

### Privacy
- No PII required for guest orders
- Minimal data collection
- GDPR compliant
- Session isolation

## 📊 Subscription Plans

| Feature | FREE | STARTER | PRO | ENTERPRISE |
|---------|------|---------|-----|------------|
| Tables | 5 | 20 | 50 | Unlimited |
| Menu Items | 20 | 100 | 500 | Unlimited |
| Orders/Month | 100 | 1,000 | 10,000 | Unlimited |
| QR Ordering | ✅ | ✅ | ✅ | ✅ |
| Analytics | ❌ | ✅ | ✅ | ✅ |
| Custom Branding | ❌ | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ✅ | ✅ | ✅ |
| White Label | ❌ | ❌ | ❌ | ✅ |
| Price | Free | $29/mo | $99/mo | Custom |

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design & architecture
- **[API.md](API.md)** - API endpoints & examples
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide
- **[SECURITY.md](SECURITY.md)** - Security implementation
- **[FEATURES.md](FEATURES.md)** - Feature roadmap

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📦 Deployment

### Docker

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### AWS (Recommended)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed AWS deployment guide.

**Estimated Cost**: $250-500/month for 10,000 daily users

## 🎯 Roadmap

### Phase 1: MVP ✅
- Guest QR ordering
- Order tracking
- Multi-tenancy
- Basic security

### Phase 2: Enhanced (Next)
- Admin dashboard
- Menu management
- Payment integration (Stripe)
- Optional user registration

### Phase 3: Advanced
- Loyalty program
- Analytics dashboard
- Mobile apps
- Kitchen display system

### Phase 4: Enterprise
- White label
- API access
- Multi-location support
- Advanced integrations

See [FEATURES.md](FEATURES.md) for complete roadmap.

## 🤝 Contributing

This is a production-ready SaaS template. Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Use for your own projects

## 📄 License

MIT License - Use freely for commercial projects

## 🙏 Acknowledgments

Built with Clean Architecture principles and industry best practices for:
- Scalability (10,000+ daily users)
- Security (OWASP Top 10)
- Performance (<200ms API response)
- Maintainability (domain-driven design)

## 📞 Support

- Documentation: See `/docs` folder
- Issues: GitHub Issues
- Email: support@yourcompany.com

---

**Built for investors, designed for users, architected for scale.**
