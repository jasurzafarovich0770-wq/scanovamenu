# Talablar Hujjati

## Kirish

QR Menu MVP ni to'liq production-ready SaaS platformaga aylantirish. Platforma uch xil rol asosida ishlaydi: Super Admin (platforma egasi), Admin (restoran egasi) va End User (menyu ko'ruvchi mijoz). Asosiy biznes talabi — restoran egasi to'lov qilmaguncha platformadan foydalana olmaydi (hard paywall). Hozircha to'lov Click / Payme orqali qo'lda amalga oshiriladi, Super Admin esa to'lovni tasdiqlaydi yoki rad etadi.

Mavjud texnologiyalar: Node.js + Express + TypeScript + Prisma + PostgreSQL (backend), React + TypeScript + Tailwind CSS + Zustand (frontend), JWT autentifikatsiya (AppUser modeli).

---

## Lug'at

- **Tizim**: QR Menu SaaS platformasi (backend + frontend birgalikda)
- **Backend**: Node.js + Express + TypeScript + Prisma asosidagi server qismi
- **Frontend**: React + TypeScript + Tailwind CSS asosidagi mijoz qismi
- **AppUser**: Tizimga kiruvchi foydalanuvchi (Super Admin yoki Admin roli bilan)
- **Super_Admin**: Platforma egasi — barcha restoranlar, to'lovlar va foydalanuvchilarni boshqaradi
- **Admin**: Restoran egasi — faqat o'z restoranini boshqaradi
- **End_User**: QR kod orqali menyuni ko'ruvchi mijoz (autentifikatsiya talab qilinmaydi)
- **SubscriptionPayment**: Restoran egasining obuna to'lovi yozuvi (PENDING / APPROVED / REJECTED holatlari)
- **Paywall**: To'lov qilinmagan Admin uchun barcha funksiyalarni bloklash mexanizmi
- **activeMiddleware**: `isActive = false` bo'lgan foydalanuvchilarni himoyalangan endpointlardan bloklash middleware'i
- **Screenshot**: To'lov amalga oshirilganligini tasdiqlovchi rasm fayli
- **Cloudinary**: Rasm fayllarini saqlash uchun bulut xizmati
- **JWT**: JSON Web Token — autentifikatsiya uchun ishlatiladi
- **isActive**: AppUser modelidagi maydon — `true` = to'lov tasdiqlangan, `false` = to'lov qilinmagan yoki tasdiqlanmagan
- **blocked**: AppUser modelidagi maydon — Super Admin tomonidan bloklangan foydalanuvchi

---

## Talablar

### Talab 1: Foydalanuvchi Ro'yxatdan O'tishi

**Foydalanuvchi hikoyasi:** Restoran egasi sifatida men tizimga ro'yxatdan o'tmoqchiman, shunda o'z restoranim uchun hisob yaratib, platformadan foydalanishni boshlashim mumkin.

#### Qabul qilish mezonlari

1. WHEN foydalanuvchi `POST /auth/register` endpointiga `username`, `password`, `restaurantName`, `ownerName`, `email` ma'lumotlarini yuborsa, THE Backend SHALL yangi `AppUser` yozuvini `role = ADMIN`, `isActive = false`, `blocked = false` qiymatlari bilan yaratsin.
2. WHEN ro'yxatdan o'tish muvaffaqiyatli bo'lsa, THE Backend SHALL JWT token va foydalanuvchi ma'lumotlarini qaytarsin.
3. IF `username` allaqachon mavjud bo'lsa, THEN THE Backend SHALL `400` status kodi va `"Bu foydalanuvchi nomi band"` xabarini qaytarsin.
4. IF `password` 6 belgidan qisqa bo'lsa, THEN THE Backend SHALL `400` status kodi va validatsiya xabarini qaytarsin.
5. WHEN yangi Admin ro'yxatdan o'tsa, THE Backend SHALL avtomatik ravishda `restaurantId` generatsiya qilsin va `Restaurant` yozuvini yaratsin.
6. THE Frontend SHALL ro'yxatdan o'tish formasida `username`, `password`, `restaurantName`, `ownerName`, `email` maydonlarini ko'rsatsin.
7. WHEN ro'yxatdan o'tish muvaffaqiyatli bo'lsa, THE Frontend SHALL foydalanuvchini Admin Dashboard sahifasiga yo'naltirsin.

---

### Talab 2: Foydalanuvchi Tizimga Kirishi

**Foydalanuvchi hikoyasi:** Tizimga ro'yxatdan o'tgan foydalanuvchi sifatida men login va parol orqali tizimga kirishni xohlayman, shunda o'z dashboardimga kira olishim mumkin.

#### Qabul qilish mezonlari

1. WHEN foydalanuvchi `POST /auth/login` endpointiga to'g'ri `username` va `password` yuborsa, THE Backend SHALL JWT token va foydalanuvchi ma'lumotlarini (`id`, `username`, `role`, `isActive`, `blocked`, `restaurantId`) qaytarsin.
2. IF `username` yoki `password` noto'g'ri bo'lsa, THEN THE Backend SHALL `401` status kodi va `"Login yoki parol noto'g'ri"` xabarini qaytarsin.
3. IF foydalanuvchi `blocked = true` bo'lsa, THEN THE Backend SHALL `403` status kodi va `"Hisobingiz bloklangan"` xabarini qaytarsin.
4. WHEN Super Admin tizimga kirsa, THE Frontend SHALL foydalanuvchini `/super-admin` sahifasiga yo'naltirsin.
5. WHEN Admin tizimga kirsa, THE Frontend SHALL foydalanuvchini `/admin` sahifasiga yo'naltirsin.
6. THE Frontend SHALL JWT tokenni `localStorage`'da saqlash va keyingi so'rovlarda `Authorization: Bearer <token>` sarlavhasi orqali yuborsin.

---

### Talab 3: Paywall — To'lov Qilinmagan Admin Uchun Bloklash

**Foydalanuvchi hikoyasi:** Platforma egasi sifatida men to'lov qilmagan restoran egalarining barcha funksiyalardan foydalanishini bloklashni xohlayman, shunda faqat to'lov qilgan foydalanuvchilar xizmatdan foydalana olsin.

#### Qabul qilish mezonlari

1. THE Backend SHALL `activeMiddleware` nomli middleware yaratsin, u `isActive = false` bo'lgan foydalanuvchilarning `/subscriptions` va `/auth` dan tashqari barcha himoyalangan endpointlarga kirishini `403` status kodi bilan bloklaydi.
2. WHEN `isActive = false` bo'lgan Admin himoyalangan endpointga so'rov yuborsa, THE activeMiddleware SHALL `{ success: false, message: "Hisobingiz faol emas. To'lov qiling.", code: "ACCOUNT_INACTIVE" }` javobini qaytarsin.
3. WHILE Admin `isActive = false` bo'lsa, THE Frontend SHALL Admin Dashboard sahifasida to'liq ekranli yoki ko'zga tashlanadigan banner ko'rsatsin: `"Platformadan foydalanish uchun to'lov qiling"`.
4. WHILE Admin `isActive = false` bo'lsa, THE Frontend SHALL barcha CRUD tugmalarini `disabled` holatda ko'rsatsin.
5. WHILE Admin `isActive = false` bo'lsa, THE Frontend SHALL `"To'lov qilish"` CTA tugmasini ko'rsatsin va u `/payment` sahifasiga yo'naltirsin.
6. WHEN Admin to'lov yuborib, `status = PENDING` bo'lsa, THE Frontend SHALL `"To'lovingiz tekshirilmoqda"` xabarini ko'rsatsin.
7. THE Frontend SHALL `GET /auth/me` endpointidan olingan `isActive` qiymatini ishlatsin (hardcoded `true` emas).

---

### Talab 4: To'lov Sahifasi va To'lov Yuborish

**Foydalanuvchi hikoyasi:** Restoran egasi sifatida men to'lov ma'lumotlarini va screenshot yuborishni xohlayman, shunda Super Admin to'lovimni tekshirib, hisobimni faollashtira olsin.

#### Qabul qilish mezonlari

1. THE Frontend SHALL `/payment` yo'lida alohida `PaymentPage` komponenti ko'rsatsin.
2. THE PaymentPage SHALL foydalanuvchi email manzilini `readonly` maydon sifatida ko'rsatsin.
3. THE PaymentPage SHALL to'lov ma'lumotlari bo'limida Click va Payme karta raqamlari hamda to'lov summasini ko'rsatsin.
4. THE PaymentPage SHALL screenshot yuklash uchun majburiy fayl yuklash maydonini ko'rsatsin.
5. THE PaymentPage SHALL ixtiyoriy izoh (`comment`) maydoni ko'rsatsin.
6. WHEN foydalanuvchi screenshot yuklasa, THE Frontend SHALL faqat rasm formatidagi fayllarni (`image/*`) qabul qilsin va maksimal hajmni 5MB bilan cheklaydi.
7. WHEN foydalanuvchi screenshot yuklasa, THE Frontend SHALL rasmni Cloudinary'ga yuklash uchun `POST /upload` endpointiga yuborsin va olingan URL ni saqlaydi.
8. WHEN foydalanuvchi to'lov formasini yuborsa, THE Frontend SHALL `POST /subscriptions` endpointiga `{ amount, screenshotUrl, comment }` ma'lumotlarini yuborsin.
9. WHEN to'lov muvaffaqiyatli yuborilsa, THE Backend SHALL `SubscriptionPayment` yozuvini `status = PENDING` bilan yaratsin.
10. IF foydalanuvchining `PENDING` holatdagi to'lovi allaqachon mavjud bo'lsa, THEN THE Backend SHALL `400` status kodi va `"Sizning to'lovingiz hali tekshirilmoqda"` xabarini qaytarsin.
11. WHEN to'lov yuborilgandan so'ng, THE Frontend SHALL `"To'lovingiz tekshirilmoqda. 1-24 soat ichida hisobingiz faollashadi."` xabarini ko'rsatsin.

---

### Talab 5: Screenshot Yuklash Xizmati

**Foydalanuvchi hikoyasi:** Restoran egasi sifatida men to'lov screenshotini yuklashni xohlayman, shunda Super Admin uni ko'rib, to'lovni tasdiqlashi mumkin.

#### Qabul qilish mezonlari

1. THE Backend SHALL `POST /upload` endpointini yaratsin, u rasm faylini qabul qilib, Cloudinary'ga yuklaydi va URL qaytaradi.
2. THE Backend SHALL faqat `image/jpeg`, `image/png`, `image/webp` formatlarini qabul qilsin.
3. IF yuklangan fayl rasm formatida bo'lmasa, THEN THE Backend SHALL `400` status kodi va `"Faqat rasm fayllari qabul qilinadi"` xabarini qaytarsin.
4. IF yuklangan fayl hajmi 5MB dan oshsa, THEN THE Backend SHALL `400` status kodi va `"Fayl hajmi 5MB dan oshmasligi kerak"` xabarini qaytarsin.
5. THE Backend SHALL Cloudinary'ga yuklash muvaffaqiyatli bo'lganda `{ success: true, url: "<cloudinary_url>" }` javobini qaytarsin.
6. WHERE S3 konfiguratsiyasi mavjud bo'lsa, THE Backend SHALL Cloudinary o'rniga S3 ishlatishga tayyor arxitektura bilan ta'minlansin (adapter pattern).

---

### Talab 6: Admin O'z To'lovlarini Ko'rish

**Foydalanuvchi hikoyasi:** Restoran egasi sifatida men yuborgan to'lovlarimning holatini ko'rishni xohlayman, shunda to'lovim tasdiqlangan yoki rad etilganini bilishim mumkin.

#### Qabul qilish mezonlari

1. WHEN Admin `GET /subscriptions/me` endpointiga so'rov yuborsa, THE Backend SHALL faqat shu foydalanuvchiga tegishli `SubscriptionPayment` yozuvlarini qaytarsin.
2. THE Backend SHALL to'lovlarni `createdAt` bo'yicha kamayish tartibida qaytarsin.
3. THE Frontend SHALL Admin Dashboard'da to'lov holati (`PENDING`, `APPROVED`, `REJECTED`) va tegishli xabarni ko'rsatsin.
4. WHEN to'lov `REJECTED` bo'lsa, THE Frontend SHALL `adminNote` (rad etish sababi) ni ko'rsatsin va yangi to'lov yuborish imkonini bersin.

---

### Talab 7: Super Admin — To'lovlarni Ko'rish va Tasdiqlash

**Foydalanuvchi hikoyasi:** Platforma egasi sifatida men barcha kelgan to'lovlarni ko'rib, tasdiqlash yoki rad etishni xohlayman, shunda faqat to'lov qilgan restoranlar platformadan foydalana olsin.

#### Qabul qilish mezonlari

1. WHEN Super Admin `GET /subscriptions` endpointiga so'rov yuborsa, THE Backend SHALL barcha `SubscriptionPayment` yozuvlarini foydalanuvchi ma'lumotlari (`email`, `username`, `restaurantName`) bilan birga qaytarsin.
2. THE Backend SHALL to'lovlarni `status` bo'yicha filtrlash imkonini bersin (`?status=PENDING`).
3. THE Frontend SHALL Super Admin panelida payments tabida to'lov ro'yxatini ko'rsatsin: foydalanuvchi email, screenshot preview, summa, holat.
4. THE Frontend SHALL har bir to'lov uchun `Tasdiqlash` va `Rad etish` tugmalarini ko'rsatsin.
5. WHEN Super Admin `PATCH /subscriptions/:id/review` endpointiga `{ action: "approve" }` yuborsa, THE Backend SHALL `SubscriptionPayment.status = APPROVED` va `AppUser.isActive = true` ni bitta tranzaksiyada yangilaydi.
6. WHEN Super Admin `PATCH /subscriptions/:id/review` endpointiga `{ action: "reject", adminNote: "..." }` yuborsa, THE Backend SHALL `SubscriptionPayment.status = REJECTED` va `adminNote` ni saqlaydi.
7. IF to'lov `PENDING` holatida bo'lmasa, THEN THE Backend SHALL `400` status kodi va `"Bu to'lov allaqachon ko'rib chiqilgan"` xabarini qaytarsin.
8. WHEN Super Admin to'lovni tasdiqlagandan so'ng, THE Frontend SHALL to'lov holatini real vaqtda yangilaydi.

---

### Talab 8: Super Admin — Restoranlarni Boshqarish

**Foydalanuvchi hikoyasi:** Platforma egasi sifatida men barcha restoranlarni ko'rib, ularni bloklash yoki blokdan chiqarishni xohlayman, shunda muammoli restoranlarni boshqara olishim mumkin.

#### Qabul qilish mezonlari

1. WHEN Super Admin `GET /auth/users` endpointiga so'rov yuborsa, THE Backend SHALL barcha `AppUser` yozuvlarini `isActive` va `blocked` holatlari bilan qaytarsin.
2. THE Frontend SHALL Super Admin panelida restaurants tabida har bir restoran uchun `isActive` va `blocked` holatlarini ko'rsatsin.
3. WHEN Super Admin `PATCH /subscriptions/users/:id/block` endpointiga so'rov yuborsa, THE Backend SHALL `AppUser.blocked` qiymatini teskari o'zgartirsin.
4. WHEN foydalanuvchi bloklanganda, THE Backend SHALL `AppUser.isActive = false` ni ham o'rnatsin.
5. IF bloklangan foydalanuvchi tizimga kirishga harakat qilsa, THEN THE Backend SHALL `403` status kodi va `"Hisobingiz bloklangan"` xabarini qaytarsin.

---

### Talab 9: Super Admin — Narxlarni Boshqarish

**Foydalanuvchi hikoyasi:** Platforma egasi sifatida men obuna narxlarini boshqarishni xohlayman, shunda narxlarni o'zgartirish imkonim bo'lsin.

#### Qabul qilish mezonlari

1. THE Frontend SHALL Super Admin panelida settings tabida oylik obuna narxini ko'rsatsin va tahrirlash imkonini bersin.
2. WHEN Super Admin narxni yangilasa, THE Backend SHALL yangi narxni saqlaydi va barcha yangi to'lov sahifalarida ko'rsatiladi.
3. THE Frontend SHALL to'lov sahifasida joriy obuna narxini dinamik ravishda ko'rsatsin (hardcoded emas).

---

### Talab 10: activeMiddleware — Himoyalangan Endpointlarni Bloklash

**Foydalanuvchi hikoyasi:** Platforma egasi sifatida men to'lov qilmagan adminlarning API endpointlaridan foydalanishini bloklashni xohlayman, shunda paywall backend darajasida ham ishlaydi.

#### Qabul qilish mezonlari

1. THE Backend SHALL `activeMiddleware` ni barcha `/menu`, `/orders`, `/waiters` va boshqa himoyalangan route'larga qo'llaydi.
2. WHEN `isActive = false` bo'lgan foydalanuvchi himoyalangan endpointga so'rov yuborsa, THE activeMiddleware SHALL `403` status kodi va `{ code: "ACCOUNT_INACTIVE" }` javobini qaytarsin.
3. THE activeMiddleware SHALL `/auth/*` va `/subscriptions/*` endpointlarini bloklashdan istisno qilsin.
4. THE activeMiddleware SHALL `SUPER_ADMIN` rolini har doim o'tkazib yuborsin (bloklash qo'llanilmaydi).
5. WHEN `blocked = true` bo'lgan foydalanuvchi so'rov yuborsa, THE activeMiddleware SHALL `403` status kodi va `{ code: "ACCOUNT_BLOCKED" }` javobini qaytarsin.

---

### Talab 11: Frontend — Hisob Holati Boshqaruvi

**Foydalanuvchi hikoyasi:** Restoran egasi sifatida men hisob holatimni (faol/nofaol/tekshirilmoqda) aniq ko'rishni xohlayman, shunda keyingi qadamni bilishim mumkin.

#### Qabul qilish mezonlari

1. WHEN Admin tizimga kirganda, THE Frontend SHALL `GET /auth/me` endpointidan `isActive` qiymatini olsin va Zustand store'da saqlaydi.
2. THE Frontend SHALL `isActive` qiymatini hardcoded `true` emas, balki backend'dan olingan real qiymat asosida ko'rsatsin.
3. WHEN `isActive = false` va `PENDING` to'lov mavjud bo'lsa, THE Frontend SHALL `"To'lovingiz tekshirilmoqda"` holatini ko'rsatsin.
4. WHEN `isActive = false` va hech qanday to'lov bo'lmasa, THE Frontend SHALL `"To'lov qilish"` CTA tugmasini ko'rsatsin.
5. WHEN `isActive = true` bo'lsa, THE Frontend SHALL barcha funksiyalarni to'liq ko'rsatsin va paywall bannerini yashirsin.
6. THE Frontend SHALL `ProtectedRoute` komponentida `isActive` holatini tekshirsin va mos UI ko'rsatsin.

---

### Talab 12: Email Bildirishnomalar

**Foydalanuvchi hikoyasi:** Restoran egasi sifatida men to'lovim tasdiqlanganda yoki rad etilganda email orqali xabar olishni xohlayman, shunda hisob holatim haqida darhol xabardor bo'lishim mumkin.

#### Qabul qilish mezonlari

1. WHEN Super Admin to'lovni tasdiqlaganda, THE Backend SHALL restoran egasiga `"Hisobingiz faollashdi"` mavzusida email yuborsin.
2. WHEN Super Admin to'lovni rad etganda, THE Backend SHALL restoran egasiga `"To'lovingiz rad etildi"` mavzusida va `adminNote` mazmunida email yuborsin.
3. IF email yuborish muvaffaqiyatsiz bo'lsa, THEN THE Backend SHALL xatoni log qilsin va asosiy tranzaksiyani bekor qilmasin.
4. THE Backend SHALL email yuborish uchun alohida `NotificationService` ishlatsin (to'g'ridan-to'g'ri controller'da emas).

---

### Talab 13: Kelajakdagi To'lov Gateway Integratsiyasiga Tayyorlik

**Foydalanuvchi hikoyasi:** Platforma egasi sifatida men kelajakda Click va Payme API'larini qo'shishni xohlayman, shunda hozirgi arxitektura o'zgartirishsiz kengaytirilishi mumkin.

#### Qabul qilish mezonlari

1. THE Backend SHALL to'lov logikasini `PaymentService` interfeysi orqali abstrakt qilsin, shunda manual va avtomatik to'lov usullari bir xil interfeys orqali ishlaydi.
2. THE Backend SHALL `SubscriptionPayment` modelida `paymentMethod` maydonini saqlaydi (`MANUAL`, `CLICK`, `PAYME`).
3. THE Backend SHALL to'lov holati o'zgarishlarini `webhookHandler` orqali qabul qilishga tayyor endpoint strukturasini yaratsin.
4. THE Backend SHALL Click va Payme uchun alohida adapter sinflari yaratishga imkon beruvchi `IPaymentProvider` interfeysi bilan ta'minlansin.
