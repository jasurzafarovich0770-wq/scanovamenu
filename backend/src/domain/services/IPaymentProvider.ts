export interface IPaymentProvider {
  name: 'MANUAL' | 'CLICK' | 'PAYME';

  createPayment(params: {
    amount: number;
    userId: string;
    returnUrl: string;
  }): Promise<{ paymentUrl: string; transactionId: string }>;

  verifyPayment(transactionId: string): Promise<{
    status: 'PAID' | 'PENDING' | 'FAILED';
    amount: number;
  }>;

  handleWebhook(payload: unknown, signature: string): Promise<{
    transactionId: string;
    status: 'PAID' | 'FAILED';
  }>;
}
