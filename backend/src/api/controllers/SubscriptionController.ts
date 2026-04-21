import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database';
import { AppError } from '../middleware/errorHandler';
import { PricingService } from '../../domain/services/PricingService';
import { notificationService } from '../../domain/services/NotificationService';

const pricingService = new PricingService();

export class SubscriptionController {

  // Admin: to'lov yuborish (screenshot bilan)
  submitPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { amount, screenshotUrl, comment } = req.body;

      if (!screenshotUrl) throw new AppError(400, 'Screenshot majburiy');
      if (!amount || amount <= 0) throw new AppError(400, 'Summa noto\'g\'ri');

      // Pending to'lov bormi?
      const existing = await prisma.subscriptionPayment.findFirst({
        where: { userId: user.userId, status: 'PENDING' },
      });
      if (existing) throw new AppError(400, 'Sizning to\'lovingiz hali tekshirilmoqda');

      const payment = await prisma.subscriptionPayment.create({
        data: {
          userId: user.userId,
          amount: Number(amount),
          screenshotUrl,
          comment: comment || null,
        },
      });

      res.status(201).json({ success: true, data: payment });
    } catch (error) { next(error); }
  };

  // Admin: o'z to'lovlarini ko'rish
  getMyPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const payments = await prisma.subscriptionPayment.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: payments });
    } catch (error) { next(error); }
  };

  // Super Admin: barcha to'lovlarni ko'rish
  getAllPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;
      const payments = await prisma.subscriptionPayment.findMany({
        where: status ? { status: status as any } : undefined,
        include: {
          user: {
            select: { id: true, username: true, email: true, restaurantName: true, isActive: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: payments });
    } catch (error) { next(error); }
  };

  // Super Admin: approve/reject
  reviewPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { action, adminNote } = req.body; // action: 'approve' | 'reject'
      const reviewer = (req as any).user;

      if (!['approve', 'reject'].includes(action)) {
        throw new AppError(400, 'action: approve yoki reject bo\'lishi kerak');
      }

      const payment = await prisma.subscriptionPayment.findUnique({ where: { id } });
      if (!payment) throw new AppError(404, 'To\'lov topilmadi');
      if (payment.status !== 'PENDING') throw new AppError(400, 'Bu to\'lov allaqachon ko\'rib chiqilgan');

      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

      // Transaction: payment yangilash + user isActive o'zgartirish
      await prisma.$transaction(async (tx) => {
        await tx.subscriptionPayment.update({
          where: { id },
          data: {
            status: newStatus,
            adminNote: adminNote || null,
            reviewedBy: reviewer.userId,
            reviewedAt: new Date(),
          },
        });

        if (action === 'approve') {
          await tx.appUser.update({
            where: { id: payment.userId },
            data: { isActive: true },
          });
        }
      });

      // Email bildirishnoma — transaction tashqarisida (xato bo'lsa rollback bo'lmaydi)
      const user = await prisma.appUser.findUnique({
        where: { id: payment.userId },
        select: { email: true, username: true },
      });

      if (user) {
        if (action === 'approve') {
          await notificationService.sendApprovalEmail(user.email, user.username);
        } else {
          await notificationService.sendRejectionEmail(user.email, user.username, adminNote || '');
        }
      }

      res.json({
        success: true,
        message: action === 'approve' ? 'To\'lov tasdiqlandi, account faollashdi' : 'To\'lov rad etildi',
      });
    } catch (error) { next(error); }
  };

  // Super Admin: user block/unblock
  toggleBlock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await prisma.appUser.findUnique({ where: { id } });
      if (!user) throw new AppError(404, 'Foydalanuvchi topilmadi');

      await prisma.appUser.update({
        where: { id },
        data: { blocked: !user.blocked, isActive: user.blocked ? user.isActive : false },
      });

      res.json({ success: true, message: user.blocked ? 'Blok olib tashlandi' : 'Bloklandi' });
    } catch (error) { next(error); }
  };

  // Public: narxni olish
  getPricing = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const monthlyPrice = await pricingService.getPrice();
      res.json({ success: true, data: { monthlyPrice, currency: 'UZS' } });
    } catch (error) { next(error); }
  };

  // Super Admin: narxni yangilash
  updatePricing = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { monthlyPrice } = req.body;
      if (!monthlyPrice || typeof monthlyPrice !== 'number' || monthlyPrice <= 0) {
        throw new AppError(400, 'monthlyPrice musbat son bo\'lishi kerak');
      }
      await pricingService.updatePrice(monthlyPrice);
      res.json({ success: true, data: { monthlyPrice, currency: 'UZS' } });
    } catch (error) { next(error); }
  };
}
