import { prisma } from './database';

const DEMO_RESTAURANT_ID = 'demo-restaurant';

const CATEGORIES = [
  { name: 'Milliy taomlar', displayOrder: 1 },
  { name: 'Fast Food', displayOrder: 2 },
  { name: 'Ichimliklar', displayOrder: 3 },
  { name: 'Desertlar', displayOrder: 4 },
];

const MENU_ITEMS: { categoryName: string; name: string; description: string; price: number; preparationTime: number; tags?: string[] }[] = [
  // Milliy taomlar
  { categoryName: 'Milliy taomlar', name: 'Osh', description: 'Toshkent usulida tayyorlangan mazali osh', price: 35000, preparationTime: 20, tags: ['popular'] },
  { categoryName: 'Milliy taomlar', name: 'Shashlik', description: "Qo'zichoq go'shtidan tayyorlangan shashlik", price: 45000, preparationTime: 25, tags: ['popular'] },
  { categoryName: 'Milliy taomlar', name: "Lag'mon", description: "Qo'lda tayyorlangan lag'mon", price: 28000, preparationTime: 15 },
  { categoryName: 'Milliy taomlar', name: 'Manti', description: "Qo'zichoq go'shtli manti", price: 32000, preparationTime: 30 },
  { categoryName: 'Milliy taomlar', name: 'Somsa', description: 'Tandirda pishirilgan somsa', price: 8000, preparationTime: 10 },
  { categoryName: 'Milliy taomlar', name: 'Shurpa', description: "Go'shtli shurpa sho'rva", price: 25000, preparationTime: 15 },
  // Fast Food
  { categoryName: 'Fast Food', name: 'Burger', description: "Mol go'shtli klassik burger", price: 38000, preparationTime: 10, tags: ['popular'] },
  { categoryName: 'Fast Food', name: 'Shawarma', description: "Tovuq go'shtli shawarma", price: 22000, preparationTime: 8 },
  { categoryName: 'Fast Food', name: 'Kartoshka fri', description: 'Qovurilgan kartoshka', price: 12000, preparationTime: 7 },
  { categoryName: 'Fast Food', name: 'Hot Dog', description: 'Klassik hot dog', price: 18000, preparationTime: 5 },
  // Ichimliklar
  { categoryName: 'Ichimliklar', name: 'Choy', description: "Ko'k choy", price: 5000, preparationTime: 3 },
  { categoryName: 'Ichimliklar', name: 'Qahva', description: 'Espresso qahva', price: 15000, preparationTime: 5, tags: ['popular'] },
  { categoryName: 'Ichimliklar', name: 'Limonad', description: 'Tabiiy limonad', price: 12000, preparationTime: 3 },
  { categoryName: 'Ichimliklar', name: 'Mineral suv', description: '0.5L mineral suv', price: 6000, preparationTime: 1 },
  // Desertlar
  { categoryName: 'Desertlar', name: 'Tort', description: 'Shokoladli tort', price: 25000, preparationTime: 5, tags: ['popular'] },
  { categoryName: 'Desertlar', name: 'Muzqaymoq', description: 'Vanil muzqaymoq', price: 15000, preparationTime: 3 },
  { categoryName: 'Desertlar', name: 'Baklava', description: "Yong'oqli baklava", price: 18000, preparationTime: 5 },
];

export async function seedDemoMenu() {
  try {
    // 1. Kategoriyalarni upsert qilish va id larini saqlash
    const categoryMap: Record<string, string> = {};

    for (const cat of CATEGORIES) {
      const existing = await prisma.menuCategory.findFirst({
        where: { restaurantId: DEMO_RESTAURANT_ID, name: cat.name },
      });

      if (existing) {
        categoryMap[cat.name] = existing.id;
      } else {
        const created = await prisma.menuCategory.create({
          data: {
            restaurantId: DEMO_RESTAURANT_ID,
            name: cat.name,
            displayOrder: cat.displayOrder,
            isActive: true,
          },
        });
        categoryMap[cat.name] = created.id;
      }
    }

    // 2. Menu itemlarni yaratish — real categoryId ishlatish
    for (const item of MENU_ITEMS) {
      const categoryId = categoryMap[item.categoryName];
      if (!categoryId) continue; // kategoriya topilmasa o'tkazib yuborish

      const exists = await prisma.menuItem.findFirst({
        where: { restaurantId: DEMO_RESTAURANT_ID, name: item.name },
      });

      if (!exists) {
        await prisma.menuItem.create({
          data: {
            restaurantId: DEMO_RESTAURANT_ID,
            categoryId,
            name: item.name,
            description: item.description,
            price: item.price,
            preparationTime: item.preparationTime,
            tags: item.tags || [],
            isAvailable: true,
          },
        });
      }
    }
  } catch (err) {
    console.error('Demo menu seed error (non-fatal):', err);
  }
}
