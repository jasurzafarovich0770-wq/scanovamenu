# System Architecture Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CUSTOMER FLOW                            │
└─────────────────────────────────────────────────────────────────┘

    📱 Customer Scans QR Code
           │
           ▼
    ┌──────────────────┐
    │  QR Code URL     │
    │  /r/{id}/t/{num} │
    └──────────────────┘
           │
           ▼
    ┌──────────────────┐
    │  React Frontend  │
    │  (Port 5173)     │
    └──────────────────┘
           │
           ▼
    ┌──────────────────┐
    │ Create Session   │
    │ POST /guest/     │
    │      session     │
    └──────────────────┘
           │
           ▼
    ┌──────────────────┐
    │ Browse Menu      │
    │ Add to Cart      │
    └──────────────────┘
           │
           ▼
    ┌──────────────────┐
    │ Place Order      │
    │ POST /orders     │
    └──────────────────┘
           │
           ▼
    ┌──────────────────┐
    │ Track Order      │
    │ GET /orders/:id  │
    └──────────────────┘
```

## Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLEAN ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Controllers  │  │  Middleware  │  │    Routes    │         │
│  │              │  │              │  │              │         │
│  │ - Guest      │  │ - Auth       │  │ - /guest     │         │
│  │ - Order      │  │ - Validation │  │ - /orders    │         │
│  │ - Menu       │  │ - Error      │  │ - /menu      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              Business Services                        │      │
│  │  ┌──────────────────┐  ┌──────────────────┐         │      │
│  │  │ GuestSession     │  │  OrderService    │         │      │
│  │  │ Service          │  │                  │         │      │
│  │  │                  │  │  - Create order  │         │      │
│  │  │ - Create session │  │  - Rate limit    │         │      │
│  │  │ - Validate       │  │  - Update status │         │      │
│  │  │ - Expire         │  │                  │         │      │
│  │  └──────────────────┘  └──────────────────┘         │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │           Repository Interfaces                       │      │
│  │  - IGuestSessionRepository                            │      │
│  │  - IOrderRepository                                   │      │
│  │  - IMenuRepository                                    │      │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                           │
│  ┌──────────────────────────────────────────────────────┐      │
│  │         Repository Implementations                    │      │
│  │  - GuestSessionRepository (Prisma)                    │      │
│  │  - OrderRepository (Prisma)                           │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  PostgreSQL  │  │    Redis     │  │   Logger     │         │
│  │  (Prisma)    │  │   (Cache)    │  │  (Winston)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    GUEST ORDER DATA FLOW                         │
└─────────────────────────────────────────────────────────────────┘

1. QR Scan
   ┌─────────┐
   │ Customer│ ──scan──> QR Code: /r/rest-id/t/5
   └─────────┘

2. Session Creation
   Frontend ──POST──> /api/guest/session
                      {restaurantId, tableNumber}
                           │
                           ▼
                    GuestSessionService
                           │
                           ▼
                    Check existing session
                           │
                           ▼
                    Create new session
                           │
                           ▼
                    Generate UUID token
                           │
                           ▼
                    Save to PostgreSQL
                           │
                           ▼
                    Return token to frontend
                           │
                           ▼
                    Store in localStorage

3. Order Placement
   Frontend ──POST──> /api/orders
              Header: x-guest-token
              Body: {items, paymentMethod}
                           │
                           ▼
                    Validate session token
                           │
                           ▼
                    Check rate limit (Redis)
                           │
                           ▼
                    OrderService.createOrder()
                           │
                           ▼
                    Calculate totals
                           │
                           ▼
                    Save to PostgreSQL
                           │
                           ▼
                    Return order details

4. Order Tracking
   Frontend ──GET──> /api/orders/:id
                           │
                           ▼
                    Fetch from PostgreSQL
                           │
                           ▼
                    Return order + status
                           │
                           ▼
                    Poll every 5 seconds
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│   Restaurant     │         │      User        │
├──────────────────┤         ├──────────────────┤
│ id (PK)          │◄───────┤│ id (PK)          │
│ name             │         │ email            │
│ slug (unique)    │         │ restaurantId (FK)│
│ subscriptionPlan │         │ role             │
│ isActive         │         └──────────────────┘
└──────────────────┘
        │
        │ 1:N
        ▼
┌──────────────────┐         ┌──────────────────┐
│  GuestSession    │         │      Table       │
├──────────────────┤         ├──────────────────┤
│ id (PK)          │         │ id (PK)          │
│ sessionToken     │◄───┐    │ restaurantId (FK)│
│ restaurantId (FK)│    │    │ tableNumber      │
│ tableNumber      │    │    │ qrCode (unique)  │
│ expiresAt        │    │    │ isActive         │
│ isActive         │    │    └──────────────────┘
└──────────────────┘    │
        │               │
        │ 1:N           │
        ▼               │
┌──────────────────┐    │
│      Order       │    │
├──────────────────┤    │
│ id (PK)          │    │
│ orderNumber      │    │
│ restaurantId (FK)│    │
│ tableNumber      │    │
│ userId (FK)      │────┘ (nullable)
│ guestSessionId   │────┘ (nullable)
│ items (JSON)     │
│ total            │
│ status           │
│ paymentStatus    │
└──────────────────┘

Key Indexes:
- GuestSession.sessionToken (unique)
- Order.restaurantId + status
- Order.guestSessionId + createdAt
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
└─────────────────────────────────────────────────────────────────┘

Request Flow:

1. ┌──────────────┐
   │ Rate Limiter │ ──> 100 req/15min per IP
   └──────────────┘

2. ┌──────────────┐
   │   Helmet.js  │ ──> Security headers
   └──────────────┘

3. ┌──────────────┐
   │     CORS     │ ──> Origin validation
   └──────────────┘

4. ┌──────────────┐
   │ Guest Auth   │ ──> Session token validation
   └──────────────┘

5. ┌──────────────┐
   │  Validation  │ ──> Zod schema validation
   └──────────────┘

6. ┌──────────────┐
   │ Rate Limit   │ ──> 5 orders/hour per session
   │  (Orders)    │
   └──────────────┘

7. ┌──────────────┐
   │   Prisma     │ ──> SQL injection prevention
   └──────────────┘
```
