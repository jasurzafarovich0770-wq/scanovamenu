import QRCode from 'qrcode';

export class QRCodeGenerator {
  /**
   * Generate QR code for a restaurant table
   * @param restaurantId - Restaurant UUID
   * @param tableNumber - Table number
   * @param baseUrl - Frontend base URL
   * @returns QR code data URL
   */
  static async generateTableQR(
    restaurantId: string,
    tableNumber: string,
    baseUrl: string = process.env.FRONTEND_URL || 'http://localhost:5173'
  ): Promise<string> {
    const url = `${baseUrl}/r/${restaurantId}/t/${tableNumber}`;
    
    const qrCode = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
    });
    
    return qrCode;
  }

  /**
   * Generate QR code as buffer for printing
   */
  static async generateTableQRBuffer(
    restaurantId: string,
    tableNumber: string,
    baseUrl?: string
  ): Promise<Buffer> {
    const url = `${baseUrl || process.env.FRONTEND_URL}/r/${restaurantId}/t/${tableNumber}`;
    
    const buffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
    });
    
    return buffer;
  }
}
