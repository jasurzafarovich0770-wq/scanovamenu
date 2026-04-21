# Admin Panel Test Guide

## Menyuni Qo'shish va Boshqarish - Test Qo'llanmasi

### 1. Tizimga Kirish

1. Brauzerda ochish: `http://localhost:5174/scanner`
2. Login ma'lumotlari:
   - **Username**: `demopizza`
   - **Password**: `pizza123`
3. "Kirish" tugmasini bosing

### 2. Kategoriya Qo'shish

1. Admin panelda "Kategoriyalar" tabini tanlang
2. "Yangi Kategoriya" tugmasini bosing
3. Quyidagi ma'lumotlarni kiriting:
   - **Kategoriya nomi**: `Ichimliklar` (majburiy)
   - **Tavsif**: `Sovuq va issiq ichimliklar` (ixtiyoriy)
   - **Tartib raqami**: `4` (ixtiyoriy, default: 0)
4. "Qo'shish" tugmasini bosing
5. Kategoriya ro'yxatda paydo bo'lishi kerak

### 3. Ovqat Qo'shish

1. "Menyu Boshqaruvi" tabiga o'ting
2. "Yangi Ovqat" tugmasini bosing
3. Formani to'ldiring:

   **Majburiy maydonlar:**
   - **Ovqat nomi**: `Coca Cola`
   - **Narx**: `8000`
   - **Kategoriya**: Dropdown'dan `Ichimliklar` tanlang

   **Ixtiyoriy maydonlar:**
   - **Tavsif**: `Sovuq gazlangan ichimlik (0.5L)`
   - **Tayyorlanish vaqti**: `2` (daqiqa)
   - **Rasm**: Kompyuterdan rasm tanlang (max 5MB)

4. "Qo'shish" tugmasini bosing
5. Ovqat ro'yxatda paydo bo'lishi kerak

### 4. Ovqatni Tahrirlash

1. Ovqat kartochkasida "✏️" tugmasini bosing
2. Kerakli maydonlarni o'zgartiring
3. Yangi rasm yuklash mumkin
4. "Saqlash" tugmasini bosing

### 5. Ovqat Mavjudligini O'zgartirish

1. Ovqat kartochkasida "✅ Mavjud" yoki "❌ Mavjud emas" tugmasini bosing
2. Holat darhol o'zgaradi
3. Mijozlar faqat mavjud ovqatlarni ko'radi

### 6. Ovqatni O'chirish

1. Ovqat kartochkasida "🗑️" tugmasini bosing
2. Tasdiqlash oynasida "OK" bosing
3. Ovqat ro'yxatdan o'chiriladi

### 7. Kategoriya Bo'yicha Filtrlash

1. "Menyu Boshqaruvi" tabida kategoriya tugmalarini ko'ring
2. Kerakli kategoriyani tanlang
3. Faqat o'sha kategoriya ovqatlari ko'rsatiladi
4. "Barchasi" tugmasi barcha ovqatlarni ko'rsatadi

## Xatoliklarni Tekshirish

### Console'da Debug Ma'lumotlari

Browser console'ni oching (F12 yoki Cmd+Option+I):

```
AdminPanel restaurantId: demo-restaurant
AdminPanel username: demopizza
Loading menu for restaurant: demo-restaurant
Items response: {success: true, data: [...]}
Categories response: {success: true, data: [...]}
```

### Umumiy Xatoliklar va Yechimlar

#### 1. "Restaurant ID topilmadi"
**Sabab**: Login qilishda restaurantId saqlanmagan
**Yechim**: 
- Logout qiling
- Qaytadan login qiling
- Browser cache'ni tozalang

#### 2. "Menyu ma'lumotlarini yuklashda xatolik"
**Sabab**: Backend ishlamayapti yoki API xatosi
**Yechim**:
- Backend ishlab turganini tekshiring: `http://localhost:3000/api/menu/restaurants/demo-restaurant/items`
- Backend loglarini tekshiring
- Network tab'da API so'rovlarni ko'ring

#### 3. "Ovqat qo'shishda xatolik"
**Sabab**: Majburiy maydonlar to'ldirilmagan yoki validation xatosi
**Yechim**:
- Barcha majburiy maydonlarni to'ldiring
- Narx 0 dan katta bo'lishi kerak
- Kategoriya tanlanganligini tekshiring

#### 4. Rasm yuklanmayapti
**Sabab**: Fayl hajmi katta yoki format noto'g'ri
**Yechim**:
- Rasm hajmi 5MB dan kichik bo'lishi kerak
- Faqat JPG, PNG, GIF formatlar qabul qilinadi
- Boshqa rasm tanlang

## API Endpoints Test

### Terminal'da Test Qilish

```bash
# Kategoriyalarni olish
curl http://localhost:3000/api/menu/restaurants/demo-restaurant/categories

# Ovqatlarni olish
curl http://localhost:3000/api/menu/restaurants/demo-restaurant/items

# Yangi ovqat qo'shish
curl -X POST http://localhost:3000/api/menu/items \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "demo-restaurant",
    "categoryId": "CATEGORY_ID_HERE",
    "name": "Test Ovqat",
    "description": "Test tavsifi",
    "price": 25000,
    "preparationTime": 15
  }'

# Ovqatni yangilash
curl -X PUT http://localhost:3000/api/menu/items/ITEM_ID_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Yangilangan Nom",
    "price": 30000
  }'

# Ovqatni o'chirish
curl -X DELETE http://localhost:3000/api/menu/items/ITEM_ID_HERE
```

## Mijozlar Uchun Ko'rinish

1. Brauzerda ochish: `http://localhost:5174/r/demo-restaurant/t/1`
2. Barcha mavjud ovqatlar ko'rsatiladi
3. Rasmlar chiroyli ko'rinishda
4. Kategoriya bo'yicha filtrlash ishlaydi
5. Faqat `isAvailable: true` bo'lgan ovqatlar ko'rinadi

## Muvaffaqiyatli Test Natijalari

✅ Kategoriya qo'shish ishlaydi
✅ Ovqat qo'shish ishlaydi
✅ Rasm yuklash ishlaydi
✅ Ovqatni tahrirlash ishlaydi
✅ Ovqatni o'chirish ishlaydi
✅ Mavjudlikni o'zgartirish ishlaydi
✅ Kategoriya filtri ishlaydi
✅ Mijozlar menyu ko'radi
✅ Real-time yangilanishlar ishlaydi

## Qo'shimcha Ma'lumot

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5174`
- Database: PostgreSQL (localhost:5432)
- Redis: localhost:6379

## Yordam

Agar muammo bo'lsa:
1. Backend va frontend ishlab turganini tekshiring
2. Browser console'ni tekshiring
3. Network tab'da API so'rovlarni ko'ring
4. Backend loglarni o'qing
5. Database'da ma'lumotlar borligini tekshiring
