# Custom-Price Quotes & Manual Quote Creation

This update gives you full control over quote prices — including your own custom
(negotiated) prices — and makes sure that whatever price you quote is the exact
price the customer pays when they accept.

---

## What's new

### 1. The "Accept Quote" button in the Quote PDF now converts the quote into a booking
Previously the button in the emailed Quote PDF opened a read-only page. Now it
takes the customer straight into the confirmation flow, where they pick a payment
method and confirm. **The price does not change** — the customer is charged the
exact amount you quoted (even if it's a custom price different from the automatic
online price). The whole button is clickable, not just the text.

### 2. The customer sees your exact quoted price when confirming
When a customer accepts a quote, the review screen clearly shows **"Total (Quoted)"**
with your price and the note *"This is the price quoted to you. It will not change
on confirmation."* No surprise recalculation.

### 3. You can edit the price on any quote or booking
Open any booking or quote in the admin dashboard, click **Edit**, and you'll now
find a **"Total Price (AUD)"** field. Type your custom price and save. That price
then flows through to the Quote/Invoice PDF, the payment amount, and the final
booking.

### 4. You can create a quote manually from the dashboard
There's a new **"Create Quote"** button (gold, top-right of the admin dashboard —
also in the mobile menu). It opens a simple form where you enter:

- Customer name, email, phone
- Service type and vehicle
- Pickup / drop-off address and pickup date & time
- Passengers, luggage
- **Your custom total price**
- Any special requests
- A checkbox to **email the quote to the customer** straight away (on by default)

When you save, the quote is created with your custom price and (if the box is
ticked) emailed to the customer with the Quote PDF. When they click "Accept
Quote", it converts to a booking at exactly that price.

---

## How to use it (quick guide)

**To send a customer a custom-priced quote from scratch:**
1. Go to the admin dashboard.
2. Click **Create Quote** (top-right).
3. Fill in the customer and trip details.
4. Enter your **Total Price**.
5. Leave "Email this quote to the client" ticked and click **Create Quote**.
6. The customer receives the quote email with a PDF and an "Accept Quote" button.

**To change the price on an existing quote or booking:**
1. Open the booking/quote from the dashboard.
2. Click **Edit**.
3. Update the **Total Price (AUD)** field.
4. Save. Re-send the quote if you'd like the customer to see the new price.

---

## Technical notes (for reference)

- No database schema change was required — the existing `basePrice` and
  `totalPrice` columns are used. When you set a custom price, both are set to that
  value for consistency.
- Quote → booking conversion (`convertQuoteToBooking`) only changes the status and
  payment method; it never recalculates the price, so your custom amount is
  preserved and is what Stripe charges.
- New/changed pieces: `adminCreateQuote` tRPC mutation, `adminModify` +
  `updateBookingDetails` now accept `totalPrice`/`basePrice`, new
  `AdminCreateQuote` page and route (`/admin/create-quote`), Quote PDF button now
  points to `/book?quote={reference}`.
