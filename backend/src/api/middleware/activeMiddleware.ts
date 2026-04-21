import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../infrastructure/database';
import { JwtPayload } from './authMiddleware';

// Paths that are exempt from active/blocked checks
const EXEMPT_PREFIXES = ['/api/auth', '/api/subscriptions'];

export const activeMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = (req as any).user as JwtPayload | undefined;

  // No user attached (shouldn't happen after authMiddleware, but guard anyway)
  if (!user) {
    next();
    return;
  }

  // SUPER_ADMIN always passes through
  if (user.role === 'SUPER_ADMIN') {
    next();
    return;
  }

  // Exempt /auth/* and /subscriptions/* paths
  const path = req.path;
  const isExempt = EXEMPT_PREFIXES.some((prefix) => req.originalUrl.startsWith(prefix));
  if (isExempt) {
    next();
    return;
  }

  try {
    const appUser = await prisma.appUser.findUnique({
      where: { id: user.userId },
      select: { isActive: true, blocked: true },
    });

    if (!appUser) {
      next();
      return;
    }

    if (appUser.blocked) {
      res.status(403).json({
        success: false,
        code: 'ACCOUNT_BLOCKED',
        message: 'Hisobingiz bloklangan',
      });
      return;
    }

    if (!appUser.isActive) {
      res.status(403).json({
        success: false,
        code: 'ACCOUNT_INACTIVE',
        message: "Hisobingiz faol emas. To'lov qiling.",
      });
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
};
