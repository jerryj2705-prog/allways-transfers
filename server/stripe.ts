import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(secretKey);
  }
  return _stripe;
}

export async function createCheckoutSession(params: {
  bookingReference: string;
  bookingId: number;
  amount: number; // in dollars
  customerEmail: string;
  customerName: string;
  serviceDescription: string;
  origin: string;
}): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: params.customerEmail,
    client_reference_id: params.bookingId.toString(),
    metadata: {
      booking_id: params.bookingId.toString(),
      booking_reference: params.bookingReference,
      customer_name: params.customerName,
      customer_email: params.customerEmail,
    },
    line_items: [
      {
        price_data: {
          currency: "aud",
          product_data: {
            name: `All Ways Transfers - ${params.serviceDescription}`,
            description: `Booking Reference: ${params.bookingReference}`,
          },
          unit_amount: Math.round(params.amount * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    // Session expires 30 minutes from now
    expires_at: Math.floor(Date.now() / 1000) + 1800,
    success_url: `${params.origin}/confirmation/${params.bookingReference}?payment=success`,
    cancel_url: `${params.origin}/confirmation/${params.bookingReference}?payment=cancelled`,
  });

  return { url: session.url!, sessionId: session.id };
}

export function constructWebhookEvent(
  payload: Buffer,
  signature: string,
): Stripe.Event {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
