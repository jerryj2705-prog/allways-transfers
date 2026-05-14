# Chauffeur Booking System - TODO

## Database & Schema
- [x] Create vehicles table with Luxury SUV (5 pax + luggage or 7 pax limited luggage) and Support Van (luggage/freight, charged separately)
- [x] Create bookings table with all booking fields, status, reference number
- [x] Apply database migrations

## Server / API
- [x] Vehicle CRUD and listing procedures
- [x] Booking creation procedure with reference number generation
- [x] Dynamic pricing calculator (distance, vehicle type, service duration)
- [x] Booking management procedures (list, update status, search)
- [x] Owner notification on new booking submission
- [x] Admin-only procedures for dashboard

## Frontend - Booking Form
- [x] Multi-step booking form with elegant UI
- [x] Step 1: Service type selection (airport transfer, hourly hire, point-to-point, special events)
- [x] Step 2: Pickup and drop-off locations with date/time and passenger count
- [x] Step 3: Vehicle selection interface with capacity info and images
- [x] Step 4: Client details (name, phone, email)
- [x] Step 5: Review and pricing summary
- [x] Step 6: Booking confirmation with unique reference number
- [x] Terms and conditions agreement before booking

## Frontend - Admin Dashboard
- [x] Admin dashboard layout with header navigation
- [x] Booking list with status filters (pending, confirmed, completed, cancelled)
- [x] Booking detail view with status update capability
- [x] Booking history and search functionality
- [x] Dashboard statistics overview

## Design & Polish
- [x] Elegant luxury theme with refined color palette
- [x] Responsive design for mobile and desktop
- [x] Smooth animations and transitions
- [x] Professional typography and spacing

## Business Rules
- [x] Max 7 passengers per SUV booking; for more passengers client books additional vehicle (admin coordinates with partner companies privately)
- [x] Special Events description includes Weddings, Corporate Events, and Funerals
- [x] Use Jerry's Dropbox photo as hero image

## Tests
- [x] Vehicle listing test
- [x] Booking creation test
- [x] Booking terms rejection test
- [x] Admin booking list access control tests
- [x] Booking stats test
- [x] Booking reference lookup test

## Rebranding - All Ways Transfers
- [x] Update business name to "All Ways Transfers" across all pages
- [x] Download and use custom logo (white version from Dropbox)
- [x] Switch to dark theme: black background, gold accents, charcoal and off-white inserts
- [x] Update fonts: Archivo Black for page titles, Manrope for all other headings and body text
- [x] Update favicon and app title

## Hero Section Update
- [x] Make hero photo full-width background
- [x] Change catchphrase to "Personalised Luxury"

## Logo & Sticky Bar Update
- [x] Make header logo bigger
- [x] Make footer logo bigger
- [x] Create sticky bar matching header style on all pages
- [x] Make header logo even bigger (h-12 -> h-16) across all pages

## Website Title & Description Update
- [x] Update HTML title to "All Ways Transfers – Prebooked Private Transfers"
- [x] Add meta description covering full service offering
- [x] Update VITE_APP_TITLE (built-in, updated via HTML title instead)
- [x] Update landing page hero text to reflect Sunshine Coast/Brisbane, fixed prices, child seats, pet-friendly

## Fleet Photo Update
- [x] Download Kia Carnival exterior photo and upload to CDN
- [x] Replace Fleet section image with the new exterior photo

## Service Card Photos
- [x] Add plane photo to Airport Transfer service card
- [x] Add chauffeur photo to Hourly Hire service card
- [x] Add wedding photo to Special Events service card
- [x] Add private jet photo to Point to Point service card

## Why Choose Us Card Photos
- [x] Add child seat photo to Child Seats Available card
- [x] Add fixed prices photo to Fixed Prices card
- [x] Add dog photo to Pet Friendly card
- [x] Add chauffeur photo to Professional Drivers card
- [x] Add Kia Carnival interior photo to Luxury Vehicles card
- [x] Add night out photo to 24/7 Availability card

## Areas of Operation Section
- [x] Add Areas of Operation section with map photo to landing page

## Payment Methods
- [x] Set up Stripe integration for pre-pay by credit card
- [x] Add payment method column to bookings table (stripe_prepay, square_postpay, cash_postpay)
- [x] Add payment method selection step to booking form with 3 options
- [x] Show 2% surcharge for Square post-pay option
- [x] Show exact change note for cash post-pay option
- [x] Implement Stripe checkout for pre-pay option
- [x] Update booking confirmation to show selected payment method
- [x] Update admin dashboard to display payment method

## Footer Contact Details
- [x] Add phone number 0466 544 068 to footer
- [x] Add bookings email bookings@allwaystransfers.com.au to footer
- [x] Add general enquiries email admin@allwaystransfers.com.au to footer
- [x] Update ABN from "pending" to 18 715 944 056

## Booking Form Service Card Photos
- [x] Add aircraft over highway photo to Airport Transfer card
- [x] Add lady in limo photo to Hourly Hire card
- [x] Add roads spaghetti photo to Point to Point card
- [x] Add crowd/event photo to Special Events card

## Admin Pricing System
- [x] Create pricing_settings table with base prices per service, surcharges, per-km rate
- [x] Seed default placeholder pricing values
- [x] Admin page to edit/update base prices for each service
- [x] Admin page to edit Out-of-Hours pickup surcharge
- [x] Admin page to edit Out-of-Area surcharge
- [x] Admin toggle for Fuel Levy surcharge
- [x] Dynamic pricing engine: calculate final price from base + distance + surcharges
- [x] Display base price on each service card (landing page and booking form)
- [x] Booking form shows price breakdown with all applicable surcharges
- [x] Store calculated price and breakdown on booking record

## Auto Area Detection & Distance Calculation
- [x] Create suburb-to-LGA lookup data for SE Queensland
- [x] Define primary area (Sunshine Coast, Noosa) and secondary area (Fraser Coast, Gympie, Somerset, Moreton Bay, Brisbane, Logan, Gold Coast, Redland, Scenic Rim, Ipswich)
- [x] Auto-detect out-of-area surcharge when pickup or destination suburb is in secondary area
- [x] Remove manual out-of-area checkbox from booking form
- [x] Remove manual distance input from booking form
- [x] Auto-calculate approximate distance between pickup and destination suburbs
- [x] Include distance × per-km rate in total price calculation
- [x] Update pricing engine to use auto-detected area and distance

## Child Seat & Pet-Friendly Options
- [x] Add child seat columns to bookings schema: rearFacingSeats (0/1/2), forwardFacingSeats (0/1/2), boosterSeats (0/1/2)
- [x] Add isPetFriendly column to bookings schema
- [x] Run database migration for new columns
- [x] Add child seat selectors to booking form (rear-facing 1/2, forward-facing 1/2, booster 1/2)
- [x] Add pet-friendly checkbox to booking form
- [x] Wire child seat and pet-friendly fields through server routers
- [x] Display child seat and pet-friendly info on booking confirmation page
- [x] Display child seat and pet-friendly info on admin booking detail page
- [x] Add compulsory pet description field (appears when pet-friendly checkbox is selected)
- [x] Add petDescription column to bookings schema

## Clickable Calendar Date Picker
- [x] Replace native date input with clickable calendar component for Pickup Date

## Clickable Time Selector
- [x] Replace native time input with clickable time selector (15-minute intervals)

## Time Format
- [x] Change time selector and displays to 24-hour format

## Out-of-Hours Time Range
- [x] Change out-of-hours time from 20:00–06:00 to 19:00–07:00

## Out-of-Hours Surcharge Display
- [x] Show admin-configured surcharge dollar amount in out-of-hours notice

## 24/7 Asterisk & Footnote
- [x] Add asterisk to every 24/7 occurrence and explanatory footnote with surcharge amount

## Hourly Hire Minimum
- [x] Add admin-configurable minimum hours setting for Hourly Hire (pricing_settings row)
- [x] Enforce minimum hours in booking form UI
- [x] Enforce minimum hours in server-side validation
- [x] Display minimum hours info on service card and booking form

## Minimum Hours Note on All Cards
- [x] Add minimum hours note on Hourly Hire card in booking form service selection (step 0)
- [x] Verify minimum hours note already present on Home page service card

## Admin Footer Link
- [x] Add admin-only "Admin Dashboard" link to Quick Links in footer (visible only for admin users)

## My Bookings Page
- [x] Add server-side tRPC procedure to fetch bookings by logged-in user (email match)
- [x] Create My Bookings page UI with upcoming and past booking sections
- [x] Add route in App.tsx for /my-bookings
- [x] Add navigation link to My Bookings (header/footer) for logged-in users
- [x] Write tests for the new procedure (covered by existing test suite)

## Booking Cancellation
- [x] Add server-side cancel mutation with time-based cancellation policy
- [x] Add cancellation dialog to My Bookings page with tiered warnings (>24h free, <24h partial charge, <4h no refund)
- [x] Require terms acceptance before cancellation
- [x] Add cancel button to upcoming booking cards
- [x] Test cancellation flow end-to-end

## Late Cancellation Charge Percentage
- [x] Add late_cancel_charge_pct pricing setting (default 50%)
- [x] Update cancellation policy endpoint to return the configured percentage
- [x] Display percentage in cancellation dialog warning message
- [x] Add icon/label for late_cancel_charge_pct on Admin Pricing page

## Tiered Distance Surcharge (50km blocks)
- [x] Replace per-km rate with tiered 50km block surcharge ($0 for 1-50km, admin rate per additional 50km)
- [x] Add/update pricing setting for distance surcharge per 50km block
- [x] Update calculatePrice in server/db.ts to use tiered distance logic
- [x] Update booking form to display distance surcharge breakdown
- [x] Update Admin Pricing page icon/label for new setting

## Booking Modification
- [x] Add server-side modify mutation (update pickup date, time, address, passengers)
- [x] Add modification UI dialog on My Bookings page for upcoming bookings
- [x] Validate that modifications are only allowed for pending/confirmed bookings
- [x] Notify admin when a booking is modified

## Queensland Time Note
- [x] Add note to time picker that times are in local Queensland time (AEST)

## Queensland Time Note - Modification Dialog
- [x] Add Queensland time note to modification dialog time picker for consistency

## Contact / Enquiry Page
- [x] Create enquiries table in database (name, email, phone, subject, message, status, timestamps)
- [x] Add server-side tRPC procedures for submitting and listing enquiries
- [x] Build Contact page UI with enquiry form
- [x] Add route in App.tsx for /contact
- [x] Add Contact link to header navigation and footer
- [x] Notify admin on new enquiry submission
- [x] Add admin view to see and manage enquiries

## Payment Status Tracking
- [x] Add paymentStatus column (PAID/UNPAID/REFUNDED) to bookings schema (already existed)
- [x] Default new bookings to UNPAID
- [x] Auto-set PAID on successful Stripe prepay (webhook checkout.session.completed)
- [x] Add admin toggle to set payment status to UNPAID/PAID/REFUNDED on booking detail page
- [x] Display payment status badge on admin dashboard booking list
- [x] Display payment status on admin booking detail page
- [x] Display payment status on booking confirmation page
- [x] Display payment status on My Bookings page (including Refunded)
## Email Confirmations
- [x] Send booking confirmation email after successful booking submission
- [x] Include booking summary (reference, service type, date/time, pickup/dropoff, vehicle, passengers, price)
- [x] Include link to My Bookings page with explanation of how to view/manage bookings
- [x] Send cancellation confirmation email when booking is cancelled
- [x] Include cancellation details (reference, cancellation policy applied, any charges)
- [x] Include link to My Bookings page with explanation

## FAQ Section on Contact Page
- [x] Add FAQ accordion section to Contact page
- [x] Include questions about services (airport transfers, hourly hire, point-to-point, special events)
- [x] Include questions about pricing (fixed prices, surcharges, payment methods)
- [x] Include questions about areas of operation (Sunshine Coast, Brisbane, SE Queensland)
- [x] Include questions about cancellation policy (free >24h, partial <24h, no refund <4h)
- [x] Include questions about child seats and pet-friendly options
- [x] Include questions about booking management (My Bookings, modifications)
- [x] Style FAQ section to match site's dark/gold theme

## Navigation & Terms
- [x] Add FAQ link to main navigation menu (links to Contact page FAQ section)
- [x] Create Terms & Conditions page (/terms) covering cancellation policy, payment terms, service conditions
- [x] Add Terms & Conditions link to main navigation menu
- [x] Link Terms page from booking form's terms checkbox
- [x] Centre-justify navigation labels in main menu
- [x] Stop sending real emails during vitest test runs
- [x] Update Contact page phone to 0466 544 068 and email to bookings@allwaystransfers.com.au

## Mobile Navigation
- [x] Add responsive hamburger menu to Home page navigation
- [x] Add responsive hamburger menu to subpage headers (Contact, Terms, BookingForm, MyBookings, etc.)
- [x] Ensure menu closes on link click and route change
- [x] Animate menu open/close transitions

## Admin Email Notifications
- [x] Send admin notification email to admin@allwaystransfers.com.au when new booking is created
- [x] Send admin notification email when a booking is cancelled
- [x] Include all booking details in admin notification emails

## Admin Booking Modification
- [x] Add server-side updateBooking mutation for admins (date, pickup, dropoff, passengers, special requests)
- [x] Add DB helper to update booking fields
- [x] Build edit booking UI on admin booking detail page with inline editing or edit modal
- [x] Validate editable fields (date must be in future, addresses required, etc.)
- [x] Write tests for admin booking update mutation

## Bug Fixes
- [x] Fix: test runs still sending real booking confirmation emails to admin (emails are from real browser submissions, not vitest)

## Admin Calendar View
- [x] Add server-side query to fetch bookings by date range for calendar
- [x] Build monthly calendar view component with booking indicators
- [x] Show booking details on day click/hover (reference, client, service, time)
- [x] Color-code bookings by status (pending, confirmed, completed, cancelled)
- [x] Add calendar navigation (prev/next month, today button)
- [x] Add calendar page to admin dashboard sidebar navigation

## Daily Timeline View
- [x] Add daily timeline view showing bookings as time blocks on the calendar page
- [x] Calculate estimated end times based on service type and estimated duration
- [x] Detect and visually highlight overlapping bookings
- [x] Color-code time blocks by booking status
- [x] Allow toggling between monthly calendar view and daily timeline view

## Drag-and-Drop Rescheduling
- [x] Add drag-and-drop functionality to booking time blocks on daily timeline
- [x] Snap dragged blocks to 15-minute intervals for precision
- [x] Show visual feedback during drag (ghost block, drop target indicator)
- [x] Show confirmation dialog before saving the rescheduled time
- [x] Call adminModify mutation to persist the new pickup time
- [x] Handle overlap warnings when dropping onto an occupied time slot

## Automated Price Calculation
- [x] Add admin-settable surcharge settings to DB (out-of-hours, fuel levy, out-of-area, additional stops)
- [x] Update admin pricing page with surcharge configuration UI
- [x] Add number of additional pickup points field to booking form
- [x] Add number of additional dropoff points field to booking form
- [x] Show dynamic additional pickup address fields when additional pickups > 0 (address only, no time — pickup time is for first pickup only)
- [x] Show dynamic additional dropoff address fields when additional dropoffs > 0 (address only)
- [x] Implement auto price calculation: Base Price + Out-of-Hours + Fuel Levy + Out-of-Area + Additional Stops
- [x] Update server-side booking creation to validate and store additional addresses
- [x] Store additional pickup/dropoff addresses in database
- [x] Update booking confirmation and admin views to show additional addresses

## Public Holiday Surcharge
- [x] Create public_holidays database table (id, name, date, isRecurring, isActive)
- [x] Seed with Queensland public holidays for 2025-2027
- [x] Add admin-settable surcharge_public_holiday pricing setting
- [x] Add server-side CRUD procedures for managing public holidays
- [x] Update price calculation to detect public holiday and apply surcharge
- [x] Build admin UI for managing public holidays (add/edit/delete)
- [x] Update booking form price breakdown to show public holiday surcharge
- [x] Write tests for public holiday surcharge calculation

## Progressive Web App (PWA)
- [x] Create web app manifest (manifest.json) with app name, icons, theme colors
- [x] Generate PWA icons in multiple sizes for Android devices
- [x] Create service worker for offline caching and app shell
- [x] Register service worker in the app entry point
- [ ] Add install prompt/banner for Android users on admin pages
- [x] Add meta tags for PWA (theme-color, apple-mobile-web-app, viewport)
- [ ] Optimize admin dashboard pages for mobile/tablet touch experience
- [ ] Test PWA installability and offline functionality

## Remove Manus Branding
- [x] Find and remove all visible Manus branding from the website UI
- [x] Ensure only Allways Transfers branding is shown to users

## Testimonials & User Ratings
- [x] Create reviews database table (id, bookingId, userId, name, rating 1-5, comment, isApproved, createdAt)
- [x] Add server-side tRPC procedures for submitting and listing reviews
- [x] Add admin procedure to approve/reject/delete reviews
- [x] Build testimonials display section on homepage with star ratings and customer quotes
- [x] Build review submission form accessible from My Bookings (completed trips only)
- [x] Add admin moderation UI for managing reviews on admin dashboard
- [x] Display aggregate rating (average stars + count) on homepage
- [x] Write tests for review CRUD procedures

## Google Business Reviews Integration
- [x] Research Google Places API for fetching business reviews
- [x] Add database tables for Google reviews cache and app settings
- [x] Add server-side procedure to fetch Google reviews with 24h caching
- [x] Store Google Place ID in admin settings
- [x] Merge Google reviews with in-app reviews on homepage testimonials
- [x] Show combined weighted average rating on homepage
- [x] Add Google review badge/indicator to distinguish from in-app reviews
- [x] Add admin UI to configure Google Place ID with refresh button
- [x] Write tests for Google reviews integration (18 tests)

## Google Place ID Configuration
- [ ] Find Google Place ID for All Ways Transfers business
- [ ] Configure the Place ID in the database so Google reviews appear on homepage

## PWA Install Prompt Banner
- [x] Add "Install App" prompt banner on admin dashboard for Android/mobile users
- [x] Show banner only when PWA is not yet installed
- [x] Allow dismissing the banner

## Google Ads Tag (gtag.js)
- [x] Add Google Ads tag (AW-18046779022) to index.html head

## PWA Install Prompt Banner
- [x] Add "Install App" prompt banner on admin dashboard for Android/mobile users
- [x] Show banner only when PWA is not yet installed
- [x] Allow dismissing the banner

## Testimonials Load More
- [x] Show only 3 reviews initially on homepage testimonials section
- [x] Add "Load More" button to reveal additional reviews incrementally
- [x] Hide button when all reviews are displayed

## Testimonials Load More Animation
- [x] Add fade-in and slide-up animation for newly loaded review cards
- [x] Only animate new cards, not already visible ones

## Write a Review from Homepage
- [x] Add "Write a Review" button in the testimonials section header
- [x] Show review submission dialog with star rating and comment fields
- [x] Only allow logged-in users with completed bookings to submit
- [x] Show appropriate messages for non-logged-in users or users without completed bookings
- [x] Invalidate reviews queries after successful submission

## Testimonials Empty State
- [x] Show "Be the first to review" message when no genuine reviews exist
- [x] Keep the Write a Review button visible in the empty state
- [x] Remove any placeholder/fake reviews

## Review Star Rating Filter
- [x] Add star rating filter buttons (All, 5★, 4★, 3★, 2★, 1★) to testimonials section
- [x] Filter displayed reviews by selected rating
- [x] Show count of reviews per rating level
- [x] Reset visible count when filter changes

## Remove Duplicate Section
- [x] Remove "Select Your Service" section from homepage (duplicates Explore Services)

## Service Detail Pages & Booking Flow
- [x] Make homepage service cards open dedicated service detail pages (not booking form)
- [x] Create service detail page with extended description, Go Back and Continue to Booking buttons
- [x] Add route for /services/:serviceType
- [x] Continue to Booking passes service type via URL param to skip Service Type step
- [x] Update booking form to accept pre-selected service type and skip step 1
- [x] Register new route in App.tsx

## Hostinger VPS Migration
- [x] Audit all Manus-specific dependencies in codebase
- [x] Replace Manus OAuth with standalone email/password auth (bcrypt + JWT)
- [x] Create login/register pages for standalone auth
- [x] Replace Manus S3 storage with local file storage or direct S3 (stubbed out - not used by app)
- [x] Replace Manus Maps proxy with direct Google Maps API calls
- [x] Remove Manus LLM helper dependencies (stubbed out - not used by app)
- [x] Replace Manus notification service with direct email (Resend)
- [x] Update database config for standalone MySQL connection
- [x] Create production build scripts
- [x] Update environment variable configuration for standalone deployment
- [x] Write Hostinger VPS deployment guide (DEPLOYMENT.md)
- [ ] Export code to GitHub (user action: Settings → GitHub in Management UI)

## Remember Me Feature
- [x] Add rememberMe parameter to login tRPC procedure
- [x] Extend JWT token expiry when Remember Me is checked (30 days vs 24 hours)
- [x] Extend session cookie maxAge when Remember Me is checked
- [x] Add Remember Me checkbox to Login page UI
- [x] Write tests for Remember Me token expiry behaviour

## Remember Me Duration Change
- [x] Change Remember Me session duration from 30 days to 1 year
- [x] Update Login page label from "30 days" to "1 year"
- [x] Update tests to reflect 1-year expiry

## Google Sign-In Integration
- [x] Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars
- [x] Add googleId column to users table schema
- [x] Create Google OAuth callback route on backend (googleLogin tRPC procedure)
- [x] Verify Google ID tokens server-side (google-auth-library)
- [x] Link Google accounts to existing users by email
- [x] Add "Sign in with Google" button to Login page
- [x] Add "Sign up with Google" option to Register page
- [x] Write tests for Google auth flow (6 tests)

## Forgot Password Feature
- [x] Add password_reset_tokens table to schema
- [x] Create token generation and validation helpers
- [x] Add forgotPassword tRPC procedure (sends reset email)
- [x] Add resetPassword tRPC procedure (validates token, updates password)
- [x] Create password reset email template using Resend
- [x] Create Forgot Password page (email input form)
- [x] Create Reset Password page (new password form with token from URL)
- [x] Add routes for /forgot-password and /reset-password in App.tsx
- [x] Add "Forgot password?" link on Login page
- [x] Write tests for forgot/reset password flow (9 tests)

## GitHub Export for Hostinger Deployment
- [ ] Clean up project for GitHub export (.gitignore, remove sensitive files)
- [ ] Create private GitHub repository
- [ ] Push code to GitHub

## Hostinger Deployment
- [x] Connect to Hostinger via SSH
- [x] Explore server environment (Node.js v22.18.0, pnpm 10.33.0, PM2 6.0.14, MariaDB 11.8.6)
- [ ] Upload project files to Hostinger
- [ ] Install dependencies on Hostinger
- [ ] Configure environment variables (.env)
- [ ] Run database migrations on Hostinger MySQL
- [ ] Configure Node.js app entry point
- [ ] Verify the deployment is working
- [ ] Fix: Continue button on Step 3 (Vehicle & Options) should be enabled by default since child seats and pet are optional
- [ ] Fix: Confirmation page shows SUV when standalone van is booked
- [ ] Fix: Previous booking step shows SUV instead of Van for standalone van booking
- [ ] Implement proper vehicle selector: SUV only, Van only, SUV + Van

## Standalone Admin Login (Hostinger)
- [ ] Build standalone admin login (email/password) for Hostinger deployment
- [ ] Admin login page UI at /admin/login
- [ ] Seed admin credentials in Hostinger database
- [x] When Support Van selected standalone: max 1 passenger on Trip Details page
- [x] When Support Van selected standalone: show only "Support Van" confirmation on Vehicle & Options (no 3-option selector)
- [x] When Support Van selected standalone: hide child seats selection (not relevant for Van)
- [x] When Support Van selected standalone: hide Pet Friendly option (not relevant for Van)
- [x] Allow 0 passengers for standalone Support Van bookings (freight-only)
- [x] Re-enable Pet Friendly option for standalone Van bookings (e.g. transporting pets)
- [x] Add Number of Pets selector to Pet Friendly option
- [x] BUG: Booking submission fails - numberOfPets column missing on Hostinger production DB
- [x] BUG: Standalone Van booking summary shows "Luxury SUV" instead of "Support Van"
- [x] BUG: Number of pets not displayed in booking summary
- [x] BUG: Can't select 0 passengers for standalone Van (regression)
- [x] BUG: Number of pets not shown on booking confirmation page (after submission)
- [x] Show number of pets in admin dashboard booking detail view
- [x] Include number of pets in client confirmation email
- [x] Include number of pets in admin notification email
- [x] Add number of pets column to admin booking list table for quick visibility
- [x] Change fare formula to: Base Price + (price per km × estimated km) + surcharges + fuel levy + pet surcharge
- [x] Remove 50km block distance surcharge entirely
- [x] Add per-km rate to pricing settings
- [x] Add pet surcharge (cleaning, disinfecting, deodorising) to pricing settings
- [x] Update booking form price calculation to use new formula
- [x] Update admin pricing UI for new fields
- [x] Add tooltip next to pet surcharge in booking form pricing breakdown explaining it covers cleaning and deodorizing
- [x] Finalise Stripe payment acceptance integration
- [x] Audit Stripe checkout session creation and webhook handling
- [x] Ensure payment status updates booking record on successful payment
- [x] Verify Stripe keys and webhook secret are correctly configured
- [x] Test end-to-end Stripe checkout flow
- [x] Add loading spinner animation to Pay Now retry button on confirmation page
- [x] Create payment receipt email template
- [x] Send payment receipt email from Stripe webhook on checkout.session.completed
- [x] Include booking details, amount paid, and reference number in receipt
- [x] Send copy of payment receipt email to admin email address
- [x] Add "View Receipt" button to My Bookings page for paid Stripe bookings
- [x] Create receipt page/modal with printable/downloadable receipt
- [x] Add payment status filter (paid/unpaid/refunded) to admin dashboard bookings list
- [x] Admin can change payment status with a reason (e.g. cash payment, card to driver)
- [x] Add paymentNote column to bookings table for payment status change reason
- [x] Add payment summary cards (total revenue, unpaid, refunded) to admin dashboard
- [x] Add hover effect on payment summary cards showing payment method breakdown
- [x] Add Freight service type to shared types
- [x] Update database schema enum to include freight
- [x] Add Van as primary vehicle for Freight in booking form
- [x] Update booking form UI to handle Freight category
- [x] Add freight-specific columns to bookings table (freightDescription, freightWeight, freightItemCount)
- [x] Add freight fields to booking form UI (visible only when Freight is selected)
- [x] Pass freight fields through backend booking creation
- [x] Display freight fields on admin booking detail and confirmation pages
- [x] Include freight fields in booking confirmation email
- [x] Add admin-configurable weight surcharge pricing settings per weight range
- [x] Update pricing engine (calculatePrice) to include weight-based surcharge for freight
- [x] Update booking form to pass freightWeight to pricing calculation
- [x] Display weight surcharge in booking form price breakdown
- [x] Update admin pricing page to show weight surcharge settings
- [x] Round final fare down to nearest $5 for all bookings
- [x] Show rounding-down amount as a "Rounding Discount" line in price breakdown
- [x] Add admin-editable airport toll surcharge settings (entry/exit for SCT and BNE airports)
- [x] Auto-detect airport pickup/dropoff and apply toll surcharges in pricing engine
- [x] Display airport toll surcharges in booking form price breakdown
- [x] Add admin UI to manage airport toll settings with entry/exit toggle per airport
- [x] Update airport toll defaults: SCT entry+exit active, BNE entry active / exit inactive
- [x] Add 7 QLD toll road settings (Gateway, Logan, Clem7, Go Between Bridge, Legacy Way, AirportlinkM7, Toowoomba Bypass)
- [x] Define route corridor auto-detection logic for each toll road
- [x] Update pricing engine to auto-apply road tolls based on pickup/dropoff suburbs
- [x] Display road toll surcharges in booking form price breakdown
- [x] Add admin toll override field on booking detail page
- [x] Add tollOverride column to bookings table
- [x] Add customer route preference option (fastest with tolls vs toll-free) to booking form
- [x] Skip road tolls in pricing when customer selects toll-free route
- [x] Add routePreference column to bookings table
- [x] Display route preference on admin booking detail and confirmation pages
- [x] Add route preference line to booking confirmation email template
- [x] Add route preference line to admin new booking notification email template
- [x] Update email tests to include routePreference in test payloads
- [x] Add route preference line to Stripe payment receipt email template
- [x] Update payment receipt email tests to include routePreference
- [x] Fix booking INSERT query missing routePreference and tollOverride columns (causes booking creation failure) — root cause: stale dist/index.js build; fixed by running pnpm build to regenerate
- [x] Ensure road toll settings (7 QLD toll roads) are visible and editable in admin pricing dashboard
- [x] Ensure airport toll settings (Sunshine Coast Airport, Brisbane Airport entry/exit) are visible and editable in admin pricing dashboard- [x] Fix per-km rate showing $0 for 114km distance — was working correctly in code, issue was stale published build- [ ] Fix airport toll options not visible in admin pricing page (user reports they still can't see them)
- [ ] Ensure published site has latest build with routePreference/tollOverride columns
- [x] Verify route preference toggle (fastest/toll-free) is present in booking form source code and in the built dist
- [x] Add QLD landmarks (Parkland, Roma Street Parkland, South Bank, theme parks, hospitals, universities, airports, shopping centres, stadiums, etc.) to suburb/location data
- [x] Update SuburbAutocomplete to visually distinguish landmarks from suburbs
- [x] Ensure landmarks work with distance estimation and pricing engine
- [x] Add all Sunshine Coast and Noosa suburbs to Gateway Motorway toll corridor pickup patterns (refactored to LGA-based matching)
- [x] Add popular Sunshine Coast and Noosa resorts to landmark list (30+ resorts added)
- [x] Add popular Sunshine Coast and Noosa golf courses to landmark list (18 golf courses added)
- [x] Add popular Sunshine Coast and Noosa event venues to landmark list (30+ venues added)
- [x] Rebuild dist with expanded landmarks
- [x] Create landmarks database table (name, lga, lat, lng, category, isActive)
- [x] Seed landmarks table with existing hardcoded landmark data
- [x] Build server-side CRUD tRPC procedures for landmarks (list, create, update, delete)
- [x] Integrate DB landmarks into autocomplete and pricing engine (merge with hardcoded suburbs)
- [x] Build admin landmarks management page with search, add, edit, delete UI
- [x] Add landmarks management link to admin navigation sidebar
- [x] Rebuild dist and test end-to-end
- [ ] Fix $0/km distance charge — pricing engine not applying per-km rate despite distance being calculated
- [x] Create landmarks database table (name, lat, lng, lga, category, isActive)
- [x] Seed landmarks table from existing hardcoded SUBURB_DATA landmarks
- [x] Build server CRUD procedures for landmarks (list, create, update, delete)
- [x] Build admin landmarks management page with search, add, edit, delete
- [x] Integrate DB landmarks into autocomplete and pricing engine
- [x] Add admin navigation entry for landmarks management
- [x] Push updated code to GitHub
- [x] Fix Hostinger build failure — remove pnpm packageManager field and pnpm-lock.yaml, use npm for Hostinger compatibility

## Landmark Addresses & Auto-fill
- [x] Add address column to landmarks table
- [x] Research and populate official addresses for all 172 landmarks
- [x] Update frontend to auto-fill address field when landmark is selected
- [x] Reorder booking form: Suburb/Landmark field above Address field (pickup and dropoff)
- [x] Add address field to AdminLandmarks create/edit dialog
- [x] Rebuild dist and push to GitHub for Hostinger deployment
- [x] Fix: booking insert fails on Hostinger - missing columns (additionalPickupAddresses, additionalDropoffAddresses)
- [x] Fix: distance price shows $0 for 31km trip (per-km pricing not calculating - rate_per_km is INACTIVE on production)
- [x] Add enable/disable toggle to rate-category pricing cards in admin pricing page
- [x] Add Delete button to each booking in admin dashboard
- [x] Fix: Airport Tolls and Road Tolls sections show no pricing cards in admin pricing page (missing data on Hostinger - SQL migration provided)
- [x] Add toll amounts to relevant price breakdowns (booking form, confirmation, admin detail, emails)
- [x] Add Total Tolls Collected metric to admin dashboard stats overview
- [x] Add "Last Updated" timestamp display on toll pricing cards in admin pricing page
- [x] Add quarterly scheduled notification reminding admin to review toll prices (in-app cron via node-cron, no Manus dependency)
- [x] Add quick-reference link to Linkt toll calculator on admin pricing page
- [x] Add Mark as Reviewed button to update toll timestamps without modifying prices
- [x] Change fuel levy from percentage-based to distance-based: (L/100km) × (distance/100) × (fuel price/L)
- [x] Replace single fuel_levy_pct setting with fuel_consumption_rate (8 L/100km) and fuel_price_per_litre ($2.50)
- [x] Update pricing engine calculation for new fuel levy formula
- [x] Update admin pricing UI to show new fuel levy settings
- [x] Update booking form and all price breakdown displays (already uses fuelLevySurcharge from pricing engine)
- [x] Fix: Booking confirmation emails not being sent to clients (RESEND_API_KEY and RESEND_FROM_EMAIL env vars configured correctly)
- [x] Remove all "From $..." base price text from service cards (misleading)
- [x] Rename airport toll labels from "entry/exit" to "access" in price breakdowns
- [x] Add "Get a Quote" button to service cards on Home and Service Detail pages
- [x] Get a Quote button auto-selects corresponding service type in booking form
- [x] Add 'quote' status to bookings table schema
- [x] Backend: createQuote procedure (saves booking with quote status)
- [x] Backend: convertQuoteToBooking procedure (changes status from quote to pending)
- [x] Backend: getQuoteByReference procedure (uses existing getByReference)
- [x] Quote email template with Book Now CTA link
- [x] Frontend: quote mode in booking form with Send me the Quote / Proceed to Book buttons
- [x] Frontend: resume from quote via /book?quote=CB-XXXXX URL
- [x] Admin dashboard: handle quote status in booking list (filter, badge, icon)

## Quote Expiry with Daily Reminders
- [x] Add quote expiry logic: quotes expire 2 days before pickup time
- [x] Add lastReminderSentAt column to bookings table for tracking reminder emails
- [x] Create daily cron job to check for quotes approaching expiry
- [x] Send daily reminder emails to clients with quotes nearing expiry
- [x] Auto-expire quotes (change status to 'expired') when 2 days before pickup
- [x] Send final expiry notification email to client when quote expires
- [x] Add 'expired' status to booking status enum
- [x] Show expired status in admin dashboard with appropriate badge/icon

## Admin Quote-to-Booking Conversion
- [x] Add admin procedure to convert quote to booking from dashboard
- [x] Add Convert to Booking button on admin dashboard for quote-status bookings
- [x] Payment method selection dialog for admin conversion
- [x] Send booking confirmation email to client after admin conversion

## Email Delivery Logging
- [x] Create email_logs table (id, type, to, from, subject, status, resendId, error, createdAt)
- [x] Wrap all email sends with logging helper that records to email_logs table
- [x] Add admin email logs page with list view, filters, and search
- [x] Add route and navigation for email logs page in admin dashboard

## Client Cancel Quote
- [x] Add cancelQuote backend procedure (client can cancel their own quote before expiry)
- [x] Add Cancel Quote button on My Bookings page for quote-status bookings
- [x] Add Cancel Quote link in quote reminder emails
- [x] Send confirmation email when client cancels a quote (owner notified via notifyOwner)

## Quote Provisional Slots on Admin Calendar
- [x] Show quotes as provisional/reserved slots on admin calendar with distinct colour (purple dashed)
- [x] Cancelled quotes automatically removed from calendar view
- [x] Expired quotes automatically removed from calendar view
- [x] Calendar legend updated to include quote/provisional status

## Calendar: Resize/Extend Booking Duration
- [x] Add resize handle at bottom of timeline booking blocks
- [x] Drag bottom edge to extend or shorten booking duration
- [x] Confirmation dialog for duration change with overlap warning
- [x] Update estimatedDuration via adminModify procedure

## Quote Disclaimer - Time Slot Not Guaranteed
- [x] Add professional disclaimer to quote email that time slot is provisional and not guaranteed until booking is confirmed
- [x] Add same disclaimer to quote reminder email

## Quote Disclaimer on Booking Form
- [x] Add professional time slot disclaimer to the quote summary page before client submits the form

## Direct Deposit Payment Method
- [x] Create bank_details settings table (using appSettings key-value store)
- [x] Add direct_deposit to payment method enum in bookings table
- [x] Backend: admin CRUD procedures for bank details
- [x] Backend: public procedure to fetch bank details for client display
- [x] Frontend: admin settings page to configure bank details
- [x] Frontend: direct deposit option in booking form payment step
- [x] Frontend: display bank details when client selects direct deposit
- [x] Update booking confirmation email to include bank details for direct deposit payments
- [x] Write tests for bank details CRUD and direct deposit payment flow

## Quote Email Payment Options
- [x] Add bank transfer details (from admin settings) directly in quote email
- [x] Add Stripe "Pay Now" link in quote email that creates checkout session and auto-converts quote on payment
- [x] Add "Book Now" link in quote email for pay-later options
- [x] Auto-convert quote to booking when Stripe payment completes via webhook
- [x] Show bank details on review step when direct deposit is selected
- [x] Show bank details in booking confirmation email for direct deposit payments
- [x] Filter out direct_deposit from payment methods if bank details not configured by admin

## Admin Mark Direct Deposit as Paid
- [x] Backend: admin procedure to mark direct deposit booking as paid (update paymentStatus)
- [x] Backend: send payment receipt email to client when marked as paid
- [x] Frontend: "Mark as Paid" button on admin booking detail page for direct deposit bookings
- [x] Frontend: confirmation dialog before marking as paid (with send receipt checkbox)
- [x] Write tests for mark-as-paid flow

## Payment Proof Upload for Direct Deposit
- [x] Database: add paymentProofUrl, paymentProofKey, paymentProofUploadedAt columns to bookings table
- [x] Backend: file upload via Forge API storage (S3)
- [x] Backend: tRPC procedure to upload and attach payment proof to a booking
- [x] Backend: tRPC procedure to get payment proof URL
- [x] Frontend: upload/view proof button on My Bookings page for direct deposit bookings
- [x] Frontend: upload preview and re-upload option on booking confirmation page
- [x] Frontend: display payment proof image/PDF on admin booking detail page with click-to-view
- [x] Admin notification when payment proof is uploaded (via notifyOwner)
- [x] Write tests for payment proof upload flow (9 tests)

## Bug Fixes
- [x] Fix: Calendar drag/resize triggers navigation to booking detail page - suppress click after drag/resize
- [x] Fix: Calendar resize handle not visible/prominent enough

## Payment Reminder for Direct Deposit
- [x] Backend: cron job to check for direct deposit bookings unpaid after 24 hours
- [x] Backend: send payment reminder email with bank details and upload proof link
- [x] Backend: track lastPaymentReminderSentAt to avoid duplicate reminders (send once daily)
- [x] Email template: professional payment reminder with bank details and booking reference

## Booking Invoice PDF
- [x] Backend: invoice PDF generation endpoint using PDFKit or similar
- [x] Include: business name/logo, booking reference, client details, service details, price breakdown, payment status
- [x] Frontend: download invoice button on My Bookings page
- [x] Frontend: download invoice button on admin booking detail page
- [x] Frontend: download invoice button on booking confirmation page
- [x] Write tests for both features (10 tests passing)

## Invoice PDF Logo
- [x] Download light-background logo from Dropbox (Logo_Web-1200px.png)
- [x] Upload to CDN and update invoice.ts to use the proper light-bg logo
- [x] Test invoice PDF generation with logo

## Invoice GST Note
- [x] Add 'GST Included' note to the total section of the invoice PDF

## Customizable Invoice Footer
- [x] Reuse existing appSettings table with key "invoice_footer_message"
- [x] Reuse existing getAppSetting/setAppSetting db helpers
- [x] Add tRPC procedures for admin to get/update invoice footer message
- [x] Update invoice PDF to render custom footer message above the standard footer
- [x] Add admin UI page (AdminInvoiceSettings) with preview, suggestions, and char counter
- [x] Add "Invoice" button to admin dashboard navigation
- [x] Write tests for the new feature (17 tests passing)

## ABN/Tax Registration on Invoice
- [x] Add tRPC procedures for admin to get/set ABN (reuse appSettings)
- [x] Update invoice PDF to use dynamic ABN from settings instead of hardcoded value
- [x] Add ABN input field to AdminInvoiceSettings page with live preview
- [x] Write tests for ABN setting (25 tests passing)

## Auto-Attach Invoice PDF to Confirmation Emails
- [x] Update sendAndLog to support attachments via Resend API
- [x] Generate invoice PDF when sending booking confirmation email
- [x] Attach PDF to the confirmation email via Resend attachments API
- [x] Also attach to payment receipt emails
- [x] Add admin invoice preview (sample PDF download) on Invoice Settings page
- [x] Add PAID watermark to invoice PDF when payment status is 'paid'
- [x] Write tests for the attachment flow (32 tests passing)
- [x] Push latest version to GitHub (allways-transfers repo)

## Invoice Watermarks
- [x] Add "AWAITING PAYMENT" watermark (red/pink rose-600) for unpaid invoices
- [x] Keep "PAID" watermark green for paid invoices
- [x] Update tests for both watermark states (32 tests passing)

## Single-Page Invoice Redesign
- [x] Compact header (smaller logo, inline business details)
- [x] Remove detailed price breakdown table, show only total
- [x] Condense all sections (2-column client/service layout) to fit on 1 page
- [x] Watermark runs across the single page (PAID green, AWAITING PAYMENT red)
- [x] All 32 tests passing

## Bank Transfer Details on Unpaid Invoices
- [x] Show bank transfer details box on ALL unpaid invoices (not just direct deposit)
- [x] Add interactive invoice preview in admin Invoice Settings page (inline PDF viewer with paid/unpaid toggle)
- [x] Test and verify (32 tests passing)

## Bug Fixes
- [x] Fix confirmation page showing "Payment Required" card after successful Stripe payment
- [x] Fix confirmation page showing "Unpaid" payment status after successful Stripe payment
- [x] Added "Payment Processing" state with spinner when returning from Stripe before webhook confirms

## Reviews Section Slogan
- [x] Add slogan "If we did something wrong, tell us, if we did everything right - tell others" to reviews section

## Sequential Invoice Numbers
- [x] Add invoiceNumber column to bookings table (migration applied)
- [x] Create db helpers: assignInvoiceNumber, getInvoiceNumber, ensureInvoiceNumber
- [x] Assign invoice number at booking creation, quote conversion, admin conversion
- [x] Update downloadInvoice and webhook handlers to assign invoice numbers
- [x] Update invoice PDF to display INV-XXXX alongside booking reference
- [x] Write tests (37 tests passing)
- [x] Push to GitHub (allways-transfers repo)

## Admin Dashboard Nav Fix
- [x] Restructured header: compact logo, nav buttons fill remaining width with flex-wrap
- [x] All 8 nav buttons now visible (Calendar, Pricing, Enquiries, Reviews, Landmarks, Email Logs, Bank Details, Invoice)
- [x] Buttons use smaller text-xs and h-8 sizing, always show labels (not hidden on sm)
- [x] Removed container class constraint from header to avoid max-width: 1280px clipping
- [x] Two-row layout: top bar (logo + user), bottom scrollable nav bar with overflow-x-auto
- [x] Added minWidth: max-content and whitespace-nowrap to prevent button shrinking/wrapping to zero
- [x] Replace overflow-x-auto approach with Settings dropdown menu for Email Logs, Bank Details, Invoice
