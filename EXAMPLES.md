# Usage Examples

## Example 1: Complete Guest Order Flow

### Step 1: Customer Scans QR Code

Restaurant prints QR code for Table 5:
```
https://yourapp.com/r/restaurant-uuid-123/t/5
```

### Step 2: Automatic Session Creation

Frontend automatically calls:
```javascript
// frontend/src/pages/QRLanding.tsx
const response = await guestApi.createSession(
  'restaurant-uuid-123',
  '5'
);

// Response:
{
  "success": true,
  "data": {
    "sessionToken": "session-uuid-456",
    "restaurantId": "restaurant-uuid-123",
    "tableNumber": "5",
    "expiresAt": "2024-01-02T12:00:00Z"
  }
}
```

Token stored in localStorage automatically.

### Step 3: Browse Menu

Customer sees menu items:
```javascript
// Mock data - replace with API call
const menuItems = [
  {
    id: 'item-1',
    name: 'Classic Burger',
    description: 'Beef patty with lettuce, tomato, cheese',
    price: 12.99,
    category: 'Main Course',
    image: '/images/burger.jpg',
    preparationTime: 15
  },
  {
    id: 'item-2',
    name: 'Margherita Pizza',
    description: 'Fresh mozzarella, basil, tomato sauce',
    price: 15.99,
    category: 'Main Course',
    preparationTime: 20
  }
];
```

### Step 4: Add to Cart

```javascript
// frontend/src/store/useCartStore.ts
const { addItem } = useCartStore();

addItem({
  menuItemId: 'item-1',
  name: 'Classic Burger',
  price: 12.99,
  quantity: 2,
  specialInstructions: 'No onions please'
});
```

### Step 5: Place Order

```javascript
const response = await orderApi.create({
  items: [
    {
      menuItemId: 'item-1',
      name: 'Classic Burger',
      price: 12.99,
      quantity: 2,
      specialInstructions: 'No onions please'
    },
    {
      menuItemId: 'item-2',
      name: 'Margherita Pizza',
      price: 15.99,
      quantity: 1
    }
  ],
  paymentMethod: 'CASH',
  specialInstructions: 'Please bring extra napkins'
});

// Response:
{
  "success": true,
  "data": {
    "id": "order-uuid-789",
    "orderNumber": "ORD-1704110400-ABC123",
    "restaurantId": "restaurant-uuid-123",
    "tableNumber": "5",
    "guestSessionId": "session-uuid-456",
    "items": [...],
    "subtotal": 41.97,
    "tax": 4.20,
    "total": 46.17,
    "status": "PENDING",
    "paymentMethod": "CASH",
    "paymentStatus": "PENDING",
    "estimatedTime": 20,
    "createdAt": "2024-01-01T12:00:00Z"
  },
  "message": "Order placed successfully"
}
```

### Step 6: Track Order

```javascript
// Poll every 5 seconds
const response = await orderApi.getById('order-uuid-789');

// Response shows current status:
{
  "success": true,
  "data": {
    "id": "order-uuid-789",
    "orderNumber": "ORD-1704110400-ABC123",
    "status": "PREPARING",  // Updated by kitchen
    "estimatedTime": 15,
    ...
  }
}
```

## Example 2: Rate Limiting

### Scenario: Customer tries to spam orders

```javascript
// First 5 orders succeed
for (let i = 0; i < 5; i++) {
  await orderApi.create({ items: [...], paymentMethod: 'CASH' });
  // ✅ Success
}

// 6th order fails
await orderApi.create({ items: [...], paymentMethod: 'CASH' });
// ❌ Error: "Order rate limit exceeded. Please try again later."
```

## Example 3: Session Expiry

### Scenario: Customer returns after 24 hours

```javascript
// Day 1: Create session
const session = await guestApi.createSession('rest-id', '5');
// Token: session-uuid-456

// Day 2 (25 hours later): Try to order
await orderApi.create({
  items: [...],
  paymentMethod: 'CASH'
});
// ❌ Error: "Session expired"

// Solution: Scan QR again to create new session
```

## Example 4: Admin Updates Order Status

### Kitchen staff updates order

```bash
# Order received
curl -X PATCH http://localhost:3000/api/orders/order-uuid-789/status \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}'

# Start preparing
curl -X PATCH http://localhost:3000/api/orders/order-uuid-789/status \
  -H "Content-Type: application/json" \
  -d '{"status": "PREPARING"}'

# Ready for serving
curl -X PATCH http://localhost:3000/api/orders/order-uuid-789/status \
  -H "Content-Type: application/json" \
  -d '{"status": "READY"}'

# Served to customer
curl -X PATCH http://localhost:3000/api/orders/order-uuid-789/status \
  -H "Content-Type: application/json" \
  -d '{"status": "SERVED"}'
```

Customer sees real-time updates on tracking page.

## Example 5: Generate QR Codes

### Backend utility to generate QR codes

```typescript
import { QRCodeGenerator } from './utils/qrGenerator';

// Generate QR code data URL
const qrDataUrl = await QRCodeGenerator.generateTableQR(
  'restaurant-uuid-123',
  '5'
);

// Returns: data:image/png;base64,iVBORw0KG...
// Can be displayed in <img src={qrDataUrl} />

// Generate QR code buffer for printing
const qrBuffer = await QRCodeGenerator.generateTableQRBuffer(
  'restaurant-uuid-123',
  '5'
);

// Save to file or send to printer
fs.writeFileSync('table-5-qr.png', qrBuffer);
```

## Example 6: Multi-Restaurant Setup

### Restaurant A

```javascript
// QR Code: /r/restaurant-a-uuid/t/1
const sessionA = await guestApi.createSession('restaurant-a-uuid', '1');

// Orders only visible to Restaurant A
const ordersA = await orderApi.getByRestaurant('restaurant-a-uuid');
```

### Restaurant B

```javascript
// QR Code: /r/restaurant-b-uuid/t/1
const sessionB = await guestApi.createSession('restaurant-b-uuid', '1');

// Orders only visible to Restaurant B
const ordersB = await orderApi.getByRestaurant('restaurant-b-uuid');
```

Data is completely isolated between restaurants.

## Example 7: Error Handling

### Invalid session token

```javascript
try {
  await orderApi.create({
    items: [...],
    paymentMethod: 'CASH'
  });
} catch (error) {
  if (error.response?.status === 401) {
    // Session invalid or expired
    // Redirect to QR scan page
    window.location.href = '/scan-qr';
  }
}
```

### Network error

```javascript
try {
  await orderApi.create({...});
} catch (error) {
  if (!error.response) {
    // Network error
    toast.error('Connection lost. Please check your internet.');
  }
}
```

### Validation error

```javascript
try {
  await orderApi.create({
    items: [], // Empty items
    paymentMethod: 'CASH'
  });
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error
    toast.error(error.response.data.error);
    // "Order must contain at least one item"
  }
}
```

## Example 8: Optional User Registration

### Guest can optionally register

```javascript
// After placing several orders as guest
const user = await authApi.register({
  email: 'customer@example.com',
  password: 'secure-password',
  name: 'John Doe'
});

// Benefits:
// - Order history
// - Loyalty points
// - Saved preferences
// - Faster checkout

// But registration is NEVER required for ordering
```

## Example 9: Subscription Plans

### Restaurant owner upgrades plan

```javascript
// FREE plan (default)
{
  maxTables: 5,
  maxMenuItems: 20,
  maxOrders: 100
}

// Upgrade to STARTER ($29/mo)
await subscriptionApi.upgrade('STARTER');

// New limits:
{
  maxTables: 20,
  maxMenuItems: 100,
  maxOrders: 1000,
  features: ['analytics', 'email_support']
}
```

## Example 10: Real-World Integration

### Complete restaurant setup

```javascript
// 1. Restaurant signs up
const restaurant = await restaurantApi.create({
  name: 'Pizza Palace',
  address: '123 Main St',
  phone: '555-0100',
  email: 'owner@pizzapalace.com'
});

// 2. Create tables
for (let i = 1; i <= 10; i++) {
  await tableApi.create({
    restaurantId: restaurant.id,
    tableNumber: i.toString(),
    capacity: 4
  });
}

// 3. Add menu items
await menuApi.createCategory({
  restaurantId: restaurant.id,
  name: 'Pizzas'
});

await menuApi.createItem({
  restaurantId: restaurant.id,
  categoryId: category.id,
  name: 'Margherita',
  price: 12.99,
  preparationTime: 15
});

// 4. Print QR codes for all tables
for (let table of tables) {
  const qr = await QRCodeGenerator.generateTableQRBuffer(
    restaurant.id,
    table.tableNumber
  );
  await printService.print(qr);
}

// 5. Restaurant is ready! 🎉
```
