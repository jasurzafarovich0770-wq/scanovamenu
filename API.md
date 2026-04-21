# API Documentation

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.yourdomain.com/api
```

## Authentication

### Guest Session Token

Include in header for guest orders:
```
x-guest-token: <session-token>
```

## Endpoints

### Guest Session

#### Create Guest Session
```http
POST /guest/session
```

**Request:**
```json
{
  "restaurantId": "uuid",
  "tableNumber": "5"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionToken": "uuid",
    "restaurantId": "uuid",
    "tableNumber": "5",
    "expiresAt": "2024-01-02T00:00:00Z"
  }
}
```

#### Validate Session
```http
GET /guest/session/:token/validate
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "restaurantId": "uuid",
    "tableNumber": "5"
  }
}
```

### Orders

#### Create Order (Guest)
```http
POST /orders
Headers: x-guest-token: <token>
```

**Request:**
```json
{
  "items": [
    {
      "menuItemId": "uuid",
      "name": "Burger",
      "price": 12.99,
      "quantity": 2,
      "specialInstructions": "No onions"
    }
  ],
  "paymentMethod": "CASH",
  "specialInstructions": "Extra napkins"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-1234567890-ABC",
    "restaurantId": "uuid",
    "tableNumber": "5",
    "items": [...],
    "subtotal": 25.98,
    "tax": 2.60,
    "total": 28.58,
    "status": "PENDING",
    "paymentMethod": "CASH",
    "paymentStatus": "PENDING",
    "createdAt": "2024-01-01T12:00:00Z"
  },
  "message": "Order placed successfully"
}
```

#### Get Order
```http
GET /orders/:orderId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-1234567890-ABC",
    "status": "PREPARING",
    "estimatedTime": 15,
    ...
  }
}
```

#### Update Order Status (Admin)
```http
PATCH /orders/:orderId/status
```

**Request:**
```json
{
  "status": "PREPARING"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PREPARING",
    ...
  }
}
```

## Order Status Flow

```
PENDING → CONFIRMED → PREPARING → READY → SERVED → COMPLETED
                                              ↓
                                          CANCELLED
```

## Rate Limiting

- Guest orders: 5 per hour per session
- API requests: 100 per 15 minutes per IP

## Error Responses

```json
{
  "success": false,
  "error": "Error message"
}
```

### Common Error Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/expired session)
- `404` - Not Found
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## WebSocket Events (Future)

### Subscribe to Order Updates
```javascript
socket.emit('subscribe:order', { orderId: 'uuid' });

socket.on('order:updated', (data) => {
  console.log('Order status:', data.status);
});
```
