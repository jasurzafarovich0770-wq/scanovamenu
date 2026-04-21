# System Architecture

## Overview

Production-level SaaS Restaurant Management & QR Ordering System built with Clean Architecture principles.

## Architecture Layers

### 1. Domain Layer (Business Logic)
- **Entities**: Core business objects (Order, GuestSession, Restaurant)
- **Repositories**: Interfaces for data access
- **Services**: Business logic and use cases
- **No dependencies on external frameworks**

### 2. Infrastructure Layer
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management
- **Repositories**: Concrete implementations
- **External Services**: Stripe, Email, etc.

### 3. API Layer
- **Controllers**: HTTP request handlers
- **Middleware**: Authentication, validation, error handling
- **Routes**: API endpoint definitions

### 4. Presentation Layer
- **Frontend**: React customer app
- **Admin**: React admin dashboard

## Key Design Decisions

### Guest-First Ordering
- QR code generates temporary session
- No registration required
- Session stored in localStorage + backend
- Auto-expires after 24 hours

### Multi-Tenancy
- Restaurant-level data isolation
- Subscription-based access control
- Shared infrastructure, isolated data

### Scalability
- Stateless API design
- Redis for distributed sessions
- Database indexing on hot paths
- Connection pooling

### Security
- Rate limiting per session
- Input validation with Zod
- SQL injection prevention (Prisma)
- XSS protection (Helmet)
- CORS configuration

## Data Flow

### Guest Order Flow
1. User scans QR code → `/r/:restaurantId/t/:tableNumber`
2. Frontend calls `POST /api/guest/session`
3. Backend creates GuestSession with token
4. Token stored in localStorage
5. User browses menu, adds to cart
6. User places order with token in header
7. Backend validates session, creates order
8. Real-time updates via WebSocket

## Database Schema

### Key Tables
- **users**: Registered users (optional)
- **restaurants**: Multi-tenant restaurants
- **guest_sessions**: Temporary guest sessions
- **tables**: QR-enabled tables
- **menu_items**: Restaurant menu
- **orders**: Guest + registered user orders

### Indexes
- `guest_sessions(sessionToken)` - Fast session lookup
- `orders(restaurantId, status)` - Admin dashboard queries
- `orders(guestSessionId, createdAt)` - Rate limiting

## Subscription Plans

### FREE
- 5 tables, 20 menu items
- Basic QR ordering

### STARTER ($29/mo)
- 20 tables, 100 menu items
- Analytics, email support

### PROFESSIONAL ($99/mo)
- 50 tables, 500 menu items
- Custom branding, loyalty program

### ENTERPRISE (Custom)
- Unlimited resources
- White-label, dedicated support

## Performance Optimizations

1. **Database**
   - Indexed queries
   - Connection pooling
   - Query optimization

2. **Caching**
   - Redis for sessions
   - Menu data caching
   - Rate limit counters

3. **Frontend**
   - Code splitting
   - Lazy loading
   - Image optimization

## Monitoring & Logging

- Winston for structured logging
- Error tracking
- Performance metrics
- Database query monitoring
