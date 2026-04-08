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
