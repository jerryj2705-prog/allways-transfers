# All Ways Transfers — Deployment Guide (Hostinger VPS)

This guide walks you through deploying the All Ways Transfers booking system on a Hostinger VPS running Ubuntu. The application is a fully self-contained Node.js application with no Manus platform dependencies.

---

## Architecture Overview

The application is a single Node.js process that serves both the API and the frontend:

| Component | Technology | Notes |
|---|---|---|
| Frontend | React 19 + Tailwind CSS 4 | Built to static files by Vite |
| Backend | Express 4 + tRPC 11 | Bundled to a single `dist/index.js` |
| Database | MySQL 8+ / TiDB | Connected via `DATABASE_URL` |
| Auth | Email/password (bcrypt + JWT) + Google Sign-In | Optional Google OAuth for social login |
| Email | Resend API | For booking confirmations and admin notifications |
| Payments | Stripe Checkout | Optional — for online pre-payment |
| Maps | Google Maps API | Optional — for Google Reviews integration |

---

## Prerequisites

Before starting, ensure you have:

1. A **Hostinger VPS** with Ubuntu 22.04+ and SSH access
2. A **MySQL 8+** database (Hostinger provides this, or you can install it on the VPS)
3. A **domain name** pointed to your VPS IP address
4. A **Resend account** with a verified domain (for sending emails)
5. Optionally: a **Stripe account** (for online payments)
6. Optionally: a **Google Maps API key** (for Google Reviews)

---

## Step 1: Prepare the VPS

SSH into your Hostinger VPS and install the required software:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 22 (LTS)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm (package manager)
npm install -g pnpm

# Install PM2 (process manager for production)
npm install -g pm2

# Verify installations
node --version    # Should be v22.x
pnpm --version    # Should be v10.x
pm2 --version
```

If MySQL is not already available on your Hostinger plan, install it:

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

---

## Step 2: Create the MySQL Database

```bash
# Log into MySQL
sudo mysql -u root -p

# Create the database and user
CREATE DATABASE chauffeur_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chauffeur'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON chauffeur_booking.* TO 'chauffeur'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Your `DATABASE_URL` will be:
```
mysql://chauffeur:YOUR_STRONG_PASSWORD_HERE@localhost:3306/chauffeur_booking
```

---

## Step 3: Upload and Set Up the Application

Upload the project files to your VPS. You can use `scp`, `rsync`, or clone from a Git repository:

```bash
# Option A: Upload via rsync from your local machine
rsync -avz --exclude node_modules --exclude dist --exclude .env \
  ./chauffeur-booking/ user@your-vps-ip:/home/user/chauffeur-booking/

# Option B: Clone from Git (if you've pushed to a repository)
cd /home/user
git clone https://github.com/your-repo/chauffeur-booking.git
```

Then install dependencies and build:

```bash
cd /home/user/chauffeur-booking

# Install production dependencies
pnpm install

# Build the application
pnpm build
```

This produces:
- `dist/index.js` — the server bundle
- `dist/public/` — the frontend static files

---

## Step 4: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cd /home/user/chauffeur-booking
nano .env
```

Add the following variables (refer to `docs/env-example.txt` for a template):

```env
# ─── Required ───
DATABASE_URL=mysql://chauffeur:YOUR_STRONG_PASSWORD_HERE@localhost:3306/chauffeur_booking
JWT_SECRET=generate-a-random-64-char-string-here

# ─── Email (Resend) ───
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@allwaystransfers.com.au
ADMIN_EMAIL=jerry@allwaystransfers.com.au

# ─── Google Maps (optional, for Google Reviews) ───
GOOGLE_MAPS_API_KEY=AIzaSy_your_key_here
VITE_GOOGLE_MAPS_API_KEY=AIzaSy_your_key_here

# ─── Google Sign-In (optional) ───
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com

# ─── Stripe (optional, for online payments) ───
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── Server ───
NODE_ENV=production
PORT=3000
```

**Important notes:**
- Generate `JWT_SECRET` with: `openssl rand -hex 32`
- The `VITE_` prefixed variables are embedded into the frontend at build time, so you must **rebuild** after changing them
- `RESEND_FROM_EMAIL` must match a verified domain in your Resend account
- If you don't need Stripe or Google Reviews, you can omit those sections entirely

---

## Step 5: Run Database Migrations

The application uses Drizzle ORM for database schema management. All migration SQL files are in the `drizzle/` directory.

```bash
cd /home/user/chauffeur-booking

# Run all migrations
DATABASE_URL="mysql://chauffeur:YOUR_PASSWORD@localhost:3306/chauffeur_booking" \
  pnpm drizzle-kit migrate
```

This creates all required tables: `users`, `vehicles`, `bookings`, `pricing_settings`, `enquiries`, `public_holidays`, `reviews`, `google_reviews_cache`, and `app_settings`.

---

## Step 6: Create the Admin Account

After migrations, you need to create your admin account. You can do this by:

**Option A: Register through the website and promote via SQL**

1. Start the server (see Step 7)
2. Go to `https://yourdomain.com/register` and create an account
3. Promote yourself to admin:

```bash
sudo mysql -u root -p chauffeur_booking

UPDATE users SET role = 'admin' WHERE email = 'jerry@allwaystransfers.com.au';
EXIT;
```

**Option B: Create directly via SQL**

```bash
# First, generate a password hash using Node.js
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YOUR_PASSWORD', 12).then(h => console.log(h))"

# Then insert the admin user
sudo mysql -u root -p chauffeur_booking

INSERT INTO users (openId, name, email, passwordHash, loginMethod, role)
VALUES ('local_admin', 'Jerry', 'jerry@allwaystransfers.com.au', 'PASTE_HASH_HERE', 'email', 'admin');
EXIT;
```

---

## Step 7: Start the Application with PM2

```bash
cd /home/user/chauffeur-booking

# Start the application
pm2 start dist/index.js --name chauffeur-booking

# Save the PM2 process list (survives reboots)
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the instructions PM2 prints (copy and run the sudo command)

# Useful PM2 commands
pm2 status              # Check if the app is running
pm2 logs chauffeur-booking  # View application logs
pm2 restart chauffeur-booking  # Restart after updates
pm2 stop chauffeur-booking     # Stop the application
```

The application will be running on `http://localhost:3000`.

---

## Step 8: Set Up Nginx Reverse Proxy with SSL

Install Nginx and Certbot for HTTPS:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Create the Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/chauffeur-booking
```

Paste the following configuration:

```nginx
server {
    listen 80;
    server_name allwaystransfers.com.au www.allwaystransfers.com.au;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase max upload size if needed
    client_max_body_size 50M;
}
```

Enable the site and get SSL certificate:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/chauffeur-booking /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Get SSL certificate (make sure your domain DNS points to the VPS first)
sudo certbot --nginx -d allwaystransfers.com.au -d www.allwaystransfers.com.au

# Certbot auto-renews, but you can test it:
sudo certbot renew --dry-run
```

---

## Step 9: Set Up Stripe Webhook (Optional)

If you're using Stripe for payments, you need to configure the webhook endpoint:

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set the URL to: `https://allwaystransfers.com.au/api/stripe/webhook`
4. Select the event: `checkout.session.completed`
5. Copy the webhook signing secret and add it to your `.env` as `STRIPE_WEBHOOK_SECRET`
6. Restart the application: `pm2 restart chauffeur-booking`

---

## Updating the Application

When you need to deploy updates:

```bash
cd /home/user/chauffeur-booking

# Pull latest code (if using Git)
git pull origin main

# Install any new dependencies
pnpm install

# Run any new migrations
DATABASE_URL="your_database_url" pnpm drizzle-kit migrate

# Rebuild the application
# NOTE: If you changed any VITE_ variables, rebuild is required
pnpm build

# Restart the application
pm2 restart chauffeur-booking
```

---

## Troubleshooting

### Application won't start
```bash
# Check PM2 logs for errors
pm2 logs chauffeur-booking --lines 50

# Verify environment variables are loaded
node -e "require('dotenv').config(); console.log(!!process.env.DATABASE_URL, !!process.env.JWT_SECRET)"
```

### Database connection issues
```bash
# Test MySQL connection
mysql -u chauffeur -p chauffeur_booking -e "SELECT 1"

# Check if MySQL is running
sudo systemctl status mysql
```

### Email notifications not sending
- Verify your domain is verified in [Resend Dashboard](https://resend.com/domains)
- Check that `RESEND_FROM_EMAIL` matches the verified domain
- The application gracefully handles email failures (returns false, doesn't crash)

### Stripe payments not working
- Verify webhook endpoint is reachable: `curl https://allwaystransfers.com.au/api/stripe/webhook`
- Check webhook logs in [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
- Ensure `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint's signing secret

### Google Reviews not loading
- Verify `GOOGLE_MAPS_API_KEY` has the Places API enabled
- Check that the Google Place ID is configured in the admin panel

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWT session tokens (min 32 chars) |
| `RESEND_API_KEY` | Yes | Resend API key for sending emails |
| `RESEND_FROM_EMAIL` | Yes | Verified sender email address |
| `ADMIN_EMAIL` | Yes | Admin email for receiving notifications |
| `GOOGLE_MAPS_API_KEY` | No | Google Maps API key (server-side, for Google Reviews) |
| `VITE_GOOGLE_MAPS_API_KEY` | No | Google Maps API key (client-side, for map display) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth Client ID (server-side, for token verification) |
| `VITE_GOOGLE_CLIENT_ID` | No | Google OAuth Client ID (client-side, for Sign-In button) |
| `STRIPE_SECRET_KEY` | No | Stripe secret key for payment processing |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `VITE_STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key (client-side) |
| `NODE_ENV` | Yes | Set to `production` for deployment |
| `PORT` | No | Server port (defaults to 3000) |

---

## Security Checklist

- [ ] Strong `JWT_SECRET` generated with `openssl rand -hex 32`
- [ ] MySQL user has minimal required privileges
- [ ] `.env` file is not committed to version control
- [ ] SSL/HTTPS is enabled via Certbot
- [ ] Firewall allows only ports 22 (SSH), 80 (HTTP), and 443 (HTTPS)
- [ ] PM2 is configured to restart on boot
- [ ] Regular database backups are scheduled

---

## Backup Strategy

Set up automated MySQL backups:

```bash
# Create a backup script
sudo nano /home/user/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/user/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

mysqldump -u chauffeur -pYOUR_PASSWORD chauffeur_booking > "$BACKUP_DIR/chauffeur_booking_$DATE.sql"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
```

```bash
chmod +x /home/user/backup-db.sh

# Schedule daily backup at 2 AM
crontab -e
# Add: 0 2 * * * /home/user/backup-db.sh
```
