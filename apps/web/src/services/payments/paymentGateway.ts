export type CheckoutSessionResult = {
  orderId: string;
  razorpayOrderId?: string;
  razorpayKeyId?: string;
  amountCents: number;
  currency: string;
};

export interface PaymentGateway {
  createMerchandiseCheckout(orderId: string): Promise<CheckoutSessionResult>;
}
