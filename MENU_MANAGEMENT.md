# Menu Management System

## Overview
The menu management system allows restaurant admins to fully manage their menu items and categories through an intuitive admin panel interface with image upload support.

## Features

### Category Management
- Create, edit, and delete menu categories
- Set category display order
- Add descriptions to categories
- View item count per category

### Menu Item Management
- Create, edit, and delete menu items
- Set item prices, descriptions, and preparation times
- **Upload and manage item images** (up to 5MB)
- Toggle item availability (in stock / out of stock)
- Organize items by category
- Filter items by category
- Add tags for better organization (popular, vegetarian, etc.)

### Customer Menu Display
- Real-time menu loading from database
- Beautiful image display for menu items
- Category-based filtering
- Responsive design for all devices
- Shows preparation time and tags
- Only displays available items

### Admin Panel Tabs
1. **Dashboard** - Overview of restaurant statistics
2. **Kategoriyalar** - Manage menu categories
3. **Menyu Boshqaruvi** - Manage menu items with image upload
4. **QR Kodlar** - View and download QR codes for tables

## API Endpoints

### Categories
- `POST /api/menu/categories` - Create a new category
- `GET /api/menu/restaurants/:restaurantId/categories` - Get all categories for a restaurant
- `PUT /api/menu/categories/:id` - Update a category
- `DELETE /api/menu/categories/:id` - Delete a category

### Menu Items
- `POST /api/menu/items` - Create a new menu item
- `GET /api/menu/restaurants/:restaurantId/items` - Get all menu items for a restaurant
- `GET /api/menu/items/:id` - Get a specific menu item
- `PUT /api/menu/items/:id` - Update a menu item
- `DELETE /api/menu/items/:id` - Delete a menu item

## Database Schema

### MenuCategory
- `id` - Unique identifier
- `restaurantId` - Restaurant reference
- `name` - Category name
- `description` - Optional description
- `displayOrder` - Sort order (0, 1, 2...)
- `isActive` - Active status

### MenuItem
- `id` - Unique identifier
- `restaurantId` - Restaurant reference
- `categoryId` - Category reference
- `name` - Item name
- `description` - Item description
- `price` - Price in currency units
- `image` - **Base64 encoded image or image URL (TEXT field, supports up to 5MB)**
- `isAvailable` - Availability status
- `preparationTime` - Time in minutes
- `allergens` - Array of allergen information
- `tags` - Array of tags (vegetarian, popular, etc.)

## Usage

### For Restaurant Admins

1. **Login to Admin Panel**
   - Navigate to `/scanner` and login with your credentials
   - Default demo credentials: `demopizza/pizza123`

2. **Create Categories First**
   - Go to "Kategoriyalar" tab
   - Click "Yangi Kategoriya" button
   - Fill in category name, description, and display order
   - Click "Qo'shish" to save

3. **Add Menu Items**
   - Go to "Menyu Boshqaruvi" tab
   - Click "Yangi Ovqat" button
   - Fill in all required fields:
     - Name
     - Description (full details about the dish)
     - Price
     - Category (select from dropdown)
     - Preparation time
     - **Upload image** (optional, max 5MB, JPG/PNG/GIF)
   - Preview the image before saving
   - Click "Qo'shish" to save

4. **Manage Items**
   - View uploaded images in the menu grid
   - Toggle availability with the green/red button
   - Click ✏️ to edit an item (including changing the image)
   - Click 🗑️ to delete an item
   - Use category filters to view specific categories

5. **Customer View**
   - Customers see all available items with images
   - Items are organized by categories
   - Full descriptions and preparation times are displayed
   - Beautiful image display with fallback emojis

## Demo Data

The system comes pre-seeded with demo data for all restaurants:

### Categories
- Pizza
- Salatlar (Salads)
- Ichimliklar (Drinks)
- Desertlar (Desserts)

### Sample Items
- Margarita Pizza - 45,000 so'm
- Pepperoni Pizza - 55,000 so'm
- Caesar Salat - 35,000 so'm
- Coca Cola - 8,000 so'm
- Tiramisu - 28,000 so'm

## Technical Implementation

### Backend
- Clean Architecture with Repository pattern
- Service layer for business logic
- Controller layer for HTTP handling
- Prisma ORM for database operations

### Frontend
- React with TypeScript
- Zustand for state management
- Axios for API calls
- Real-time updates
- Modern UI with animations

### Files Created/Modified
- `backend/src/domain/repositories/IMenuRepository.ts` - Menu repository interface
- `backend/src/infrastructure/repositories/MenuRepository.ts` - Menu data access
- `backend/src/domain/services/MenuService.ts` - Menu business logic
- `backend/src/api/controllers/MenuController.ts` - Menu API endpoints
- `backend/src/api/routes/menu.routes.ts` - Menu routing
- `backend/prisma/seed-menu.ts` - Demo menu data seeder
- `backend/prisma/schema.prisma` - Updated MenuItem with TEXT image field
- `frontend/src/pages/AdminPanel.tsx` - **Added image upload functionality**
- `frontend/src/pages/Menu.tsx` - **Connected to real API with image display**
- `frontend/src/lib/api.ts` - Menu API client functions
- `frontend/src/index.css` - Added line-clamp utilities

## Image Upload Features

### Supported Formats
- JPG/JPEG
- PNG
- GIF
- Maximum size: 5MB

### Storage Method
- Images are stored as Base64 encoded strings in the database
- TEXT field type supports large image data
- No external storage service required
- Instant upload and preview

### Image Display
- Admin panel shows thumbnails in menu grid
- Customer menu displays full images with fallback
- Responsive image sizing
- Lazy loading for performance
- Error handling with emoji fallbacks

## Testing

To test the menu management system:

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Login to admin panel with demo credentials
4. Navigate through the tabs to test all features

## Future Enhancements

Potential improvements:
- External image storage (AWS S3, Cloudinary)
- Image compression and optimization
- Multiple images per item (gallery)
- Bulk operations (import/export CSV with images)
- Menu item variants (sizes, options)
- Nutritional information
- Multi-language support
- Menu scheduling (breakfast, lunch, dinner)
- Special offers and discounts
- Image cropping and editing tools
