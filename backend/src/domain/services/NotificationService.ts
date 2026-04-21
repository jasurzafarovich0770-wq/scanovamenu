import nodemailer from 'nodemailer';
import { logger } from '../../infrastructure/logger';

class NotificationService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter | null {
    if (!process.env.SMTP_HOST) {
      logger.warn('SMTP_HOST sozlanmagan — email yuborilmaydi');
      return null;
    }

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    return this.transporter;
  }

  async sendApprovalEmail(email: string, username: string): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) return;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@qrmenu.uz',
        to: email,
        subject: 'Hisobingiz faollashdi',
        html: `
          <h2>Tabriklaymiz, ${username}!</h2>
          <p>Sizning to'lovingiz tasdiqlandi va hisobingiz faollashtirildi.</p>
          <p>Endi QR Menu tizimidan to'liq foydalanishingiz mumkin.</p>
        `,
      });
      logger.info(`Approval email yuborildi: ${email}`);
    } catch (error) {
      logger.error('Approval email yuborishda xato:', error);
    }
  }

  async sendRejectionEmail(email: string, username: string, adminNote: string): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) return;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@qrmenu.uz',
        to: email,
        subject: "To'lovingiz rad etildi",
        html: `
          <h2>Hurmatli ${username},</h2>
          <p>Afsuski, sizning to'lovingiz rad etildi.</p>
          ${adminNote ? `<p><strong>Sabab:</strong> ${adminNote}</p>` : ''}
          <p>Qo'shimcha ma'lumot uchun biz bilan bog'laning.</p>
        `,
      });
      logger.info(`Rejection email yuborildi: ${email}`);
    } catch (error) {
      logger.error('Rejection email yuborishda xato:', error);
    }
  }
}

export const notificationService = new NotificationService();
