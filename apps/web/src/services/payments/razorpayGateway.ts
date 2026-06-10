declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export async function openRazorpayCheckout(options: {
  keyId: string;
  orderId: string;
  razorpayOrderId: string;
  amountCents: number;
  currency: string;
  name: string;
  description: string;
  onSuccess: (paymentId: string) => void;
  onDismiss?: () => void;
}): Promise<void> {
  await loadRazorpayScript();
  if (!window.Razorpay) throw new Error("Razorpay unavailable");

  const rzp = new window.Razorpay({
    key: options.keyId,
    amount: options.amountCents,
    currency: options.currency,
    name: options.name,
    description: options.description,
    order_id: options.razorpayOrderId,
    handler: (response: { razorpay_payment_id: string }) => {
      options.onSuccess(response.razorpay_payment_id);
    },
    modal: { ondismiss: options.onDismiss },
  });
  rzp.open();
}
