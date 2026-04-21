# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-01

### Added - MVP Release

#### Core Features
- Guest-first QR ordering system (no registration required)
- Automatic guest session creation and management
- 24-hour session expiry with auto-cleanup
- Real-time order tracking
- Multi-tenant restaurant support
- Subscription-based SaaS model (FREE, STARTER, PRO, ENTERPRISE)

#### Backend
- Clean Architecture implementation
- Node.js + Express + TypeScript
- PostgreSQL database with Prisma ORM
- Redis for session caching
- RESTful API design
- Domain-driven design patterns

#### Security
- Rate limiting (5 orders/hour per session, 100 req/15min per IP)
- Input validation with Zod schemas
- SQL injection prevention (Prisma)
- XSS protection (Helmet.js)
- CORS configuration
- Guest session security
- Privacy-focused design

#### Frontend
- React 18 with TypeScript
- TailwindCSS for styling
- Zustand for state management
- QR landing page with auto-session
- Menu browsing
- Shopping cart
- Order tracking with status updates

#### Infrastructure
- Docker containerization
- Docker Compose for local development
- PostgreSQL and Redis services
- Environment configuration
- Database migrations

#### Documentation
- Comprehensive README
- Architecture documentation
- API documentation
- Security documentation
- Deployment guide
- Testing guide
- Quick start guide
- Examples and diagrams

### Security
- Implemented rate limiting on orders and API requests
- Added session validation middleware
- Configured security headers with Helmet.js
- Enabled CORS with whitelist

## [Unreleased]

### Planned for v1.1.0
- Admin dashboard UI
- Menu management interface
- Payment integration (Stripe)
- Email notifications
- WebSocket real-time updates

### Planned for v1.2.0
- Optional user registration
- Order history
- Loyalty program
- Analytics dashboard

### Planned for v2.0.0
- Mobile apps (iOS/Android)
- Kitchen display system
- Table management
- Staff management
- Advanced analytics

---

## Version History

- **1.0.0** - Initial MVP release with guest ordering
- **0.1.0** - Project setup and architecture design
