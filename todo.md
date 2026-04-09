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
