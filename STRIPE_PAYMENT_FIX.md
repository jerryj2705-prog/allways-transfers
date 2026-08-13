# Stripe Payment Processing Fix

## Issue
Customers reported they were unable to pay via credit card through Stripe. All card payment attempts were failing silently.

## Root Cause
The production server had an **invalid Stripe secret key** configured in the `.env` file:
- **Invalid key:** `mk_1TH1P...` (wrong prefix - not a valid Stripe key format)
- **Valid format:** `sk_live_...` (required for live payments)

The authentication failure was being caught silently in the code (`try/catch` blocks in `server/routers.ts`), so:
- No error was displayed to customers
- No checkout URL was generated
- Payment simply didn't work
- Other payment methods (cash, bank transfer) were unaffected

## Fix Applied (Aug 13, 2026)

### 1. Updated Stripe Secret Key
**Location:** `/home/u460432638/domains/allwaystransfers.com.au/hbuilds/config/.env`

Replaced the invalid `mk_...` key with the correct live secret key starting with `sk_live_51TFuUp...`

**Backup created:** `.env.backup-stripe-20260813-015735`

### 2. Verification
Tested the new key against Stripe's API:
```
✅ STRIPE AUTH SUCCESS
✅ CHECKOUT SESSION CREATED
✅ Account currencies: AUD
```

### 3. Deployment
- App restarted via `touch tmp/restart.txt`
- Site verified: HTTP 200
- All Stripe operations now working correctly

## Testing
To verify card payments are working:

1. **Create a test booking:**
   - Go to https://allwaystransfers.com.au/book
   - Fill in booking details
   - Choose **"Pay Now (Card)"** payment method
   - Complete the booking

2. **Expected behavior:**
   - You should receive a Stripe checkout URL
   - Clicking the payment link should open Stripe's secure checkout page
   - You can test with Stripe test cards (if in test mode) or complete a real payment

3. **Check email:**
   - Booking confirmation should be sent to customer
   - Payment receipt should be sent after successful payment

## Configuration Summary

Current production Stripe configuration (`hbuilds/config/.env`):

| Variable | Value | Status |
|----------|-------|--------|
| `STRIPE_SECRET_KEY` | `sk_live_51TFuUp...` | ✅ Valid (107 chars) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_51T...` | ✅ Valid (109 chars) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ✅ Present (40 chars) |

## Security Note

⚠️ **IMPORTANT:** The Stripe secret key was shared during this troubleshooting session. For security best practices:

1. **Roll the API key** in Stripe Dashboard:
   - Go to https://dashboard.stripe.com/apikeys
   - Find the current live secret key
   - Click **"Roll key"** to generate a new one
   - Update the new key in production `.env` file
   - Restart the app

2. **Why roll the key:**
   - Any secret key shared in chat logs should be considered compromised
   - Rolling generates a new key and invalidates the old one
   - The old key becomes useless even if someone finds it

3. **After rolling:**
   - The new key will still start with `sk_live_51TFuUp...` (same account)
   - Update it in `/home/u460432638/domains/allwaystransfers.com.au/hbuilds/config/.env`
   - Run `touch ~/domains/allwaystransfers.com.au/nodejs/tmp/restart.txt`
   - Verify with the test script above

## Related Files

- **Stripe integration:** `server/stripe.ts`
- **Checkout creation:** `server/routers.ts` (lines 488-498, 867-877, 1599-1608)
- **Webhook handler:** `server/_core/index.ts` (line 55+)
- **Environment config:** `server/_core/env.ts`

## Future Improvements

Consider adding better error handling for Stripe failures:
1. Log Stripe authentication errors to admin notifications
2. Show user-friendly error message when checkout creation fails
3. Add monitoring/alerting for failed payment attempts
4. Validate Stripe keys on app startup and log warnings if invalid

## Contact

If card payments still don't work after this fix:
1. Check the email logs table for Stripe-related errors
2. Check server logs for Stripe API errors
3. Verify the webhook endpoint is receiving events: https://dashboard.stripe.com/webhooks
4. Test with Stripe's test mode first to isolate live vs test key issues
