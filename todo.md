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
- [x] Fix booking INSERT query missing routePreference and tollOverride columns (causes booking creation failure) — fixed by server restart to pick up schema changes
