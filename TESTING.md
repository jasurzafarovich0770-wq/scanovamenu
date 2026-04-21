# Testing Guide

## Testing Strategy

### Test Pyramid
```
        /\
       /E2E\
      /------\
     /  API   \
    /----------\
   /    Unit    \
  /--------------\
```

## Manual Testing

### Guest Order Flow

#### 1. QR Code Access
```bash
# Open in browser
http://localhost:5173/r/test-restaurant-id/t/5
```

**Expected:**
- Auto-creates guest session
- Shows "Welcome! Table 5"
- Redirects to menu after 1.5s
- Session token stored in localStorage

#### 2. Browse Menu
```bash
http://localhost:5173/menu
```

**Expected:**
- Shows restaurant menu
- Displays table number in header
- Cart button shows item count and total

#### 3. Add to Cart
- Click on menu items
- Adjust quantities
- Add special instructions

**Expected:**
- Cart updates in real-time
- Total calculates correctly
- Items persist in localStorage

#### 4. Place Order
```bash
http://localhost:5173/cart
```

**Expected:**
- Shows order summary
- Calculates tax (10%)
- Places order successfully
- Redirects to tracking page

#### 5. Track Order
```bash
http://localhost:5173/order/{orderId}
```

**Expected:**
- Shows order status
- Updates every 5 seconds
- Displays order items and total
- Shows progress indicators

### API Testing with cURL

#### Create Guest Session
```bash
curl -X POST http://localhost:3000/api/guest/session \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "test-restaurant-id",
    "tableNumber": "5"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "sessionToken": "uuid",
    "restaurantId": "test-restaurant-id",
    "tableNumber": "5",
    "expiresAt": "2024-01-02T00:00:00Z"
  }
}
```

#### Validate Session
```bash
curl http://localhost:3000/api/guest/session/{token}/validate
```

#### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "x-guest-token: {your-token}" \
  -d '{
    "items": [
      {
        "menuItemId": "item-1",
        "name": "Burger",
        "price": 12.99,
        "quantity": 2
      }
    ],
    "paymentMethod": "CASH"
  }'
```

#### Get Order
```bash
curl http://localhost:3000/api/orders/{orderId}
```

#### Update Order Status
```bash
curl -X PATCH http://localhost:3000/api/orders/{orderId}/status \
  -H "Content-Type: application/json" \
  -d '{"status": "PREPARING"}'
```

## Rate Limiting Tests

### Test Order Rate Limit
```bash
# Place 6 orders rapidly (limit is 5/hour)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/orders \
    -H "x-guest-token: {token}" \
    -H "Content-Type: application/json" \
    -d '{"items":[{"menuItemId":"1","name":"Test","price":10,"quantity":1}],"paymentMethod":"CASH"}'
  echo ""
done
```

**Expected:**
- First 5 succeed
- 6th returns 429 error: "Order rate limit exceeded"

### Test API Rate Limit
```bash
# Make 101 requests rapidly (limit is 100/15min)
for i in {1..101}; do
  curl http://localhost:3000/health
done
```

**Expected:**
- First 100 succeed
- 101st returns 429: "Too many requests"

## Security Tests

### Invalid Session Token
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "x-guest-token: invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"items":[],"paymentMethod":"CASH"}'
```

**Expected:** 401 Unauthorized

### Missing Session Token
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items":[],"paymentMethod":"CASH"}'
```

**Expected:** 401 "Guest session token required"

### SQL Injection Attempt
```bash
curl "http://localhost:3000/api/orders/1' OR '1'='1"
```

**Expected:** 404 or validation error (not SQL error)

### XSS Attempt
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "x-guest-token: {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{
      "menuItemId": "1",
      "name": "<script>alert(1)</script>",
      "price": 10,
      "quantity": 1
    }],
    "paymentMethod": "CASH"
  }'
```

**Expected:** Order created, but script tags escaped in response

## Performance Tests

### Load Testing with Apache Bench

```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:3000/health

# Test order creation (with valid token)
ab -n 100 -c 5 -p order.json -T application/json \
  -H "x-guest-token: {token}" \
  http://localhost:3000/api/orders
```

**Expected:**
- Health: >500 req/sec
- Orders: >50 req/sec
- 99% < 200ms response time

### Database Query Performance

```bash
# Check slow queries in logs
docker logs restaurant-saas-backend | grep "Slow query"
```

**Expected:** No queries >100ms

## Integration Tests

### Session Expiry
```bash
# 1. Create session
# 2. Wait 24 hours (or modify GUEST_SESSION_DURATION)
# 3. Try to place order

# Expected: 401 "Session expired"
```

### Table Session Isolation
```bash
# 1. Create session for Table 5
# 2. Create session for Table 6
# 3. Verify different tokens
# 4. Verify orders are isolated
```

## Database Tests

### Check Indexes
```sql
-- Connect to database
psql postgresql://restaurant:restaurant123@localhost:5432/restaurant_saas

-- Check indexes
\di

-- Expected indexes:
-- guest_sessions_sessionToken_key
-- orders_restaurantId_idx
-- orders_guestSessionId_idx
-- orders_status_idx
```

### Check Constraints
```sql
-- Verify unique constraints
SELECT * FROM pg_constraint WHERE contype = 'u';

-- Verify foreign keys
SELECT * FROM pg_constraint WHERE contype = 'f';
```

## Monitoring Tests

### Health Check
```bash
curl http://localhost:3000/health
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Redis Connection
```bash
docker exec -it restaurant-saas-redis redis-cli ping
```

**Expected:** PONG

### Database Connection
```bash
docker exec -it restaurant-saas-postgres psql -U restaurant -d restaurant_saas -c "SELECT 1"
```

**Expected:** 1 row returned

## Automated Testing (Future)

### Unit Tests
```typescript
// backend/src/domain/services/__tests__/GuestSessionService.test.ts
describe('GuestSessionService', () => {
  it('should create guest session', async () => {
    const session = await sessionService.createSession({
      restaurantId: 'test',
      tableNumber: '5',
      ipAddress: '127.0.0.1',
      userAgent: 'test',
    });
    
    expect(session.sessionToken).toBeDefined();
    expect(session.tableNumber).toBe('5');
  });
  
  it('should validate active session', async () => {
    const session = await sessionService.validateSession(token);
    expect(session.isActive).toBe(true);
  });
  
  it('should reject expired session', async () => {
    await expect(
      sessionService.validateSession(expiredToken)
    ).rejects.toThrow('Session expired');
  });
});
```

### API Tests
```typescript
// backend/src/api/__tests__/orders.test.ts
describe('POST /api/orders', () => {
  it('should create order with valid session', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('x-guest-token', validToken)
      .send({
        items: [{ menuItemId: '1', name: 'Test', price: 10, quantity: 1 }],
        paymentMethod: 'CASH',
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.orderNumber).toBeDefined();
  });
  
  it('should reject order without session', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({ items: [], paymentMethod: 'CASH' });
    
    expect(response.status).toBe(401);
  });
});
```

### E2E Tests
```typescript
// frontend/e2e/guest-order.spec.ts
describe('Guest Order Flow', () => {
  it('should complete full order flow', async () => {
    // 1. Scan QR
    await page.goto('/r/test-restaurant/t/5');
    await expect(page.locator('text=Welcome')).toBeVisible();
    
    // 2. Browse menu
    await page.waitForURL('/menu');
    await expect(page.locator('text=Table 5')).toBeVisible();
    
    // 3. Add to cart
    await page.click('button:has-text("Add to Cart")');
    await expect(page.locator('text=Cart (1)')).toBeVisible();
    
    // 4. Place order
    await page.click('text=Cart');
    await page.click('text=Place Order');
    
    // 5. Track order
    await page.waitForURL(/\/order\/.+/);
    await expect(page.locator('text=Order #')).toBeVisible();
  });
});
```

## Test Data Setup

### Seed Database
```bash
cd backend
npx prisma db seed
```

### Create Test Restaurant
```sql
INSERT INTO "Restaurant" (id, name, slug, address, phone, email, "ownerId")
VALUES (
  'test-restaurant-id',
  'Test Restaurant',
  'test-restaurant',
  '123 Test St',
  '555-0100',
  'test@restaurant.com',
  'owner-id'
);
```

### Create Test Menu Items
```sql
INSERT INTO "MenuItem" (id, "restaurantId", "categoryId", name, price, "isAvailable")
VALUES
  ('item-1', 'test-restaurant-id', 'cat-1', 'Burger', 12.99, true),
  ('item-2', 'test-restaurant-id', 'cat-1', 'Pizza', 15.99, true);
```

## Continuous Testing

### Pre-commit Hooks
```bash
# .husky/pre-commit
npm run lint
npm run test
```

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run test
      - run: npm run test:e2e
```

## Test Coverage Goals

- Unit Tests: >80%
- Integration Tests: >70%
- E2E Tests: Critical paths covered
- API Tests: All endpoints covered
