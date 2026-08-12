// Shared helper to build a complete, itemised price breakdown from a stored booking.
//
// The bookings table stores each price component separately. This helper turns
// those stored values into a list of line items and — crucially — appends a
// reconciliation line when needed so that the listed components ALWAYS add up to
// the stored total. That keeps the breakdown correct even for:
//   • older bookings created before every component was stored,
//   • quotes/bookings where the admin set a custom (negotiated) total price,
//   • any rounding differences.
//
// Used by the customer confirmation page, the admin booking detail page, the
// receipt page and the Quote / Invoice PDF generator so every surface shows the
// same, fully-reconciled breakdown.

import { SERVICE_TYPES } from "./types";

export interface BreakdownLine {
  label: string;
  amount: number; // always a positive magnitude
  isDiscount?: boolean; // true → shown as a subtraction (e.g. -$5.00)
}

export interface PriceBreakdownResult {
  lines: BreakdownLine[];
  total: number;
}

// A minimal shape covering the fields this helper reads from a booking row.
export interface BookingLike {
  serviceType?: string | null;
  vehicleName?: string | null;
  estimatedDistance?: string | number | null;
  basePrice?: string | number | null;
  distanceCharge?: string | number | null;
  outOfHoursSurcharge?: string | number | null;
  outOfAreaSurcharge?: string | number | null;
  fuelLevySurcharge?: string | number | null;
  additionalStopsSurcharge?: string | number | null;
  additionalPickupCount?: number | null;
  additionalDropoffCount?: number | null;
  publicHolidaySurcharge?: string | number | null;
  publicHolidayName?: string | null;
  petSurcharge?: string | number | null;
  numberOfPets?: number | null;
  weightSurcharge?: string | number | null;
  freightWeight?: string | null;
  airportTollSurcharge?: string | number | null;
  airportTollDetails?: string | { airport: string; direction: string; amount: number }[] | null;
  roadTollSurcharge?: string | number | null;
  roadTollDetails?: string | { road: string; amount: number }[] | null;
  supportVanPrice?: string | number | null;
  needsSupportVan?: number | boolean | null;
  cardSurcharge?: string | number | null;
  roundingDiscount?: string | number | null;
  totalPrice?: string | number | null;
}

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

function parseDetails<T>(v: unknown): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v as T[];
  try {
    const parsed = JSON.parse(String(v));
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function buildPriceBreakdown(booking: BookingLike): PriceBreakdownResult {
  const lines: BreakdownLine[] = [];

  // Base fare
  const serviceLabel =
    (booking.serviceType && SERVICE_TYPES[booking.serviceType as keyof typeof SERVICE_TYPES]?.label) ||
    "Service";
  lines.push({ label: `${serviceLabel} – Base`, amount: num(booking.basePrice) });

  // Distance
  const distance = num(booking.distanceCharge);
  if (distance > 0) {
    const km = num(booking.estimatedDistance);
    lines.push({ label: km > 0 ? `Distance (${km.toFixed(1)} km)` : "Distance", amount: distance });
  }

  // Out-of-hours
  const outOfHours = num(booking.outOfHoursSurcharge);
  if (outOfHours > 0) lines.push({ label: "Out-of-Hours Surcharge", amount: outOfHours });

  // Out-of-area
  const outOfArea = num(booking.outOfAreaSurcharge);
  if (outOfArea > 0) lines.push({ label: "Out-of-Area Surcharge", amount: outOfArea });

  // Fuel levy
  const fuel = num(booking.fuelLevySurcharge);
  if (fuel > 0) lines.push({ label: "Fuel Levy", amount: fuel });

  // Additional stops
  const stops = num(booking.additionalStopsSurcharge);
  if (stops > 0) {
    const count = (booking.additionalPickupCount ?? 0) + (booking.additionalDropoffCount ?? 0);
    lines.push({
      label: count > 0 ? `Additional Stops (${count} stop${count !== 1 ? "s" : ""})` : "Additional Stops",
      amount: stops,
    });
  }

  // Public holiday
  const holiday = num(booking.publicHolidaySurcharge);
  if (holiday > 0) {
    lines.push({
      label: booking.publicHolidayName ? `Public Holiday (${booking.publicHolidayName})` : "Public Holiday",
      amount: holiday,
    });
  }

  // Pet surcharge
  const pet = num(booking.petSurcharge);
  if (pet > 0) {
    const pets = booking.numberOfPets ?? 0;
    lines.push({ label: pets > 0 ? `Pet Surcharge (${pets} pet${pets !== 1 ? "s" : ""})` : "Pet Surcharge", amount: pet });
  }

  // Weight surcharge (freight)
  const weight = num(booking.weightSurcharge);
  if (weight > 0) {
    const w = booking.freightWeight ? booking.freightWeight.replace(/_/g, " ").replace("plus", "+") : "";
    lines.push({ label: w ? `Weight Surcharge (${w})` : "Weight Surcharge", amount: weight });
  }

  // Airport tolls (itemised where possible)
  const airportToll = num(booking.airportTollSurcharge);
  if (airportToll > 0) {
    const details = parseDetails<{ airport: string; direction: string; amount: number }>(booking.airportTollDetails);
    if (details.length > 0) {
      details.forEach((t) => lines.push({ label: `${t.airport} ${t.direction} toll`, amount: num(t.amount) }));
    } else {
      lines.push({ label: "Airport Tolls", amount: airportToll });
    }
  }

  // Road tolls (itemised where possible)
  const roadToll = num(booking.roadTollSurcharge);
  if (roadToll > 0) {
    const details = parseDetails<{ road: string; amount: number }>(booking.roadTollDetails);
    if (details.length > 0) {
      details.forEach((t) => lines.push({ label: `${t.road} Toll`, amount: num(t.amount) }));
    } else {
      lines.push({ label: "Road Tolls", amount: roadToll });
    }
  }

  // Support van
  const supportVan = num(booking.supportVanPrice);
  if (supportVan > 0) lines.push({ label: "Support Van", amount: supportVan });

  // Card surcharge (Square 2%)
  const card = num(booking.cardSurcharge);
  if (card > 0) lines.push({ label: "Card Surcharge (2%)", amount: card });

  // Rounding discount
  const rounding = num(booking.roundingDiscount);
  if (rounding > 0) lines.push({ label: "Rounding Discount", amount: rounding, isDiscount: true });

  // Reconciliation: guarantee the listed lines sum exactly to the stored total.
  const total = num(booking.totalPrice);
  const sum = lines.reduce((s, l) => s + (l.isDiscount ? -l.amount : l.amount), 0);
  const adjustment = Math.round((total - sum) * 100) / 100;
  if (Math.abs(adjustment) >= 0.01) {
    if (adjustment > 0) {
      lines.push({ label: "Price Adjustment", amount: adjustment });
    } else {
      lines.push({ label: "Discount", amount: Math.abs(adjustment), isDiscount: true });
    }
  }

  return { lines, total };
}
