# Complete Price Breakdown — What Changed

## The problem you reported

> "Can we make sure that the Total Quote/Booking price lists all the components
> making it up, so the total price is the correct sum of all the components.
> Right now, some components are missing."

You were right. When a booking or quote total was shown, only **some** of the
charges that made up that total were listed. The individual lines did not add up
to the total because several components were never being saved with the booking.

## Why it was happening

When a price is calculated, the system works out up to **15 separate charges**,
for example:

- Base fare
- Distance charge
- Out-of-hours surcharge
- Out-of-area surcharge
- Fuel levy
- Additional stops
- Public holiday surcharge
- Pet surcharge
- Weight (freight) surcharge
- Airport tolls
- Road tolls
- Support van
- Card surcharge (2%)
- Rounding discount

**Only about half of these were actually being stored** with the booking. So the
customer confirmation, the receipt, the admin screen and the PDFs could only show
the handful that happened to be saved — and those never added up to the total.

## What we fixed

1. **We now store every component.** Eight charges that used to be thrown away
   (distance, out-of-hours, out-of-area, fuel levy, pet, weight, card surcharge
   and rounding) are now saved with each new booking and quote.

2. **One shared "breakdown builder".** We built a single piece of logic that
   turns a booking into a clean, itemised list of every charge. Every screen and
   every PDF now uses that same logic, so they all show the **same** breakdown.

3. **The list always adds up to the total — guaranteed.** After listing every
   stored component, the builder compares the sum of the lines to the saved
   total. If there is ever any difference (for example on an older booking made
   before this fix, or on a quote where you set a custom negotiated price), it
   adds a final reconciliation line:
   - **"Price Adjustment"** when the total is a little higher than the listed
     parts, or
   - **"Discount"** when you gave the customer a lower custom price.

   This means the numbers **always** balance — the components will always sum to
   the total shown, on every booking, new or old.

## Where you'll see the full breakdown now

- **Customer booking confirmation page** — full itemised list above the total.
- **Receipt page** (and printed/PDF receipt) — new "Price Breakdown" section.
- **Admin booking detail** — the pricing box now lists every component (and we
  fixed a bug where the base line was always labelled "SUV Base").
- **Quote PDF and Invoice/Booking PDF** — a new "PRICE BREAKDOWN" table appears
  above the total box.

## Custom / negotiated prices still work

When you override a total price on a booking, we now keep the original component
charges intact and simply show the difference as a **Price Adjustment** or
**Discount** line. Nothing is lost, and the breakdown still balances.

## Older bookings

Bookings created before this change did not save the individual components, so
their breakdown will show the base fare plus a single **"Price Adjustment"** line
that accounts for the rest. This is expected — the total is still correct and the
figures still add up. All **new** bookings and quotes show the full itemised list.

## Technical notes (for future reference)

- 8 new columns were added to the `bookings` table:
  `distanceCharge`, `outOfHoursSurcharge`, `outOfAreaSurcharge`,
  `fuelLevySurcharge`, `petSurcharge`, `weightSurcharge`, `cardSurcharge`,
  `roundingDiscount` (all `DECIMAL(10,2)`, default `0`).
- The shared logic lives in `shared/priceBreakdown.ts` (`buildPriceBreakdown`).
- The database migration was applied to production via
  `migrate-price-components.mjs` (safe to re-run; it skips columns that already
  exist).
- Changes are live on https://allwaystransfers.com.au.
