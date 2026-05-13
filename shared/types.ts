/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// ─── Business Constants ───

export const SERVICE_TYPES = {
  airport_transfer: {
    label: "Airport Transfer",
    description: "Reliable pickup and drop-off to and from the airport",
    icon: "Plane",
  },
  hourly_hire: {
    label: "Hourly Hire",
    description: "Flexible chauffeur service charged by the hour",
    icon: "Clock",
  },
  point_to_point: {
    label: "Point to Point",
    description: "Direct transfer between two locations",
    icon: "MapPin",
  },
  special_events: {
    label: "Special Events",
    description: "Weddings, corporate events, funerals, and special occasions",
    icon: "Star",
  },
  freight: {
    label: "Freight",
    description: "Goods and parcel delivery using our spacious van",
    icon: "Package",
  },
} as const;

export type ServiceType = keyof typeof SERVICE_TYPES;

export const BOOKING_STATUSES = {
  quote: { label: "Quote", color: "purple" },
  pending: { label: "Pending", color: "amber" },
  confirmed: { label: "Confirmed", color: "blue" },
  completed: { label: "Completed", color: "green" },
  cancelled: { label: "Cancelled", color: "red" },
} as const;

export type BookingStatus = keyof typeof BOOKING_STATUSES;

export const PAYMENT_METHODS = {
  stripe_prepay: {
    label: "Pre-pay by Credit Card",
    description: "Pay securely online via Stripe. Your booking is confirmed immediately upon payment.",
    surcharge: 0,
  },
  square_postpay: {
    label: "Pay Driver by Card",
    description: "Pay the driver directly by credit card on the day. A 2% card processing surcharge applies.",
    surcharge: 0.02,
  },
  cash_postpay: {
    label: "Pay Driver by Cash",
    description: "Pay the driver in cash on the day. Please ensure the correct amount is prepared, as the driver is not required to carry change.",
    surcharge: 0,
  },
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export const SUV_CAPACITY = {
  withLuggage: 5,
  limitedLuggage: 7,
  description: "Up to 5 passengers with standard check-in luggage, or up to 7 passengers with limited luggage",
} as const;
