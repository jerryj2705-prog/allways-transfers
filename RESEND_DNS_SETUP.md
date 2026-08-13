# Resend Domain Verification - DNS Setup Guide

## Problem

Your domain `allwaystransfers.com.au` has been added to Resend but is **not verified** because the required DNS records were never added to Hostinger. This is why all emails are failing with error:

> "The [allwaystransfers.com.au](http://allwaystransfers.com.au) domain is not verified"

## Solution

Add the DNS records from Resend to your Hostinger DNS zone.

---

## Step 1: Get ALL DNS Records from Resend

1. **Log in to Resend:** [https://resend.com/login](https://resend.com/login)

* Use the account: `jerryj2705@gmail.com` (or whichever account you used)

1. **Go to Domains:** Click "Domains" in the left sidebar

2. **Click on your domain:** `allwaystransfers.com.au`

3. **View all DNS records:** You should see a section called "DNS Records" with multiple records. Currently visible:

* **DKIM record** (already shown in your screenshot)

* Possibly **SPF** or **DMARC** records (scroll down to see all)

1. **Important:** You need to copy **ALL** the records Resend shows you, not just the DKIM one.

### From your screenshot, I can see this record:

**Record 1: DKIM (Domain Keys)**

* **Type:** `TXT`

* **Name:** `resend._domainkey`

* **Value/Content:** `p=MIGfMA0GCSqGSIb3...AG43E2QIDAQAb` (full value shown in Resend)

* **TTL:** `Auto` or `3600`

**⚠️ Check for more records:** Resend typically requires 1-3 records. Scroll down in the Resend DNS Records section to see if there are more.

---

## Step 2: Add DNS Records to Hostinger

1. **Log in to Hostinger:** [https://hpanel.hostinger.com](https://hpanel.hostinger.com)

2. **Navigate to DNS Zone:**

* Go to **Domains** → `allwaystransfers.com.au` → **DNS / Name Servers** → **DNS Zone**

* Or direct link: [https://hpanel.hostinger.com/domain/allwaystransfers.com.au/dns](https://hpanel.hostinger.com/domain/allwaystransfers.com.au/dns)

1. **For EACH record from Resend, click "Add Record":**

### Adding the DKIM Record:

**Click "Add Record" button, then:**

* **Type:** Select `TXT`

* **Name:** Enter `resend._domainkey` (exactly as shown in Resend)

* **Points to / Value:** Paste the FULL content from Resend (starts with `p=MIGfMA0GCS...`)

* **TTL:** Leave as default (3600) or set to Auto

* **Click "Add"**

### If Resend shows an SPF record:

You might need to **UPDATE** your existing SPF record instead of adding a new one:

* Find your current TXT record with value starting with `v=spf1`

* **Edit** it to include Resend: `v=spf1 include:_spf.mail.hostinger.com include:_spf.resend.com ~all`

* Or if Resend provides a specific SPF record, follow their instructions

### Add any other records Resend shows

1. **Save all changes** in Hostinger

---

## Step 3: Verify in Resend

1. **Go back to Resend:** [https://resend.com/domains](https://resend.com/domains)

2. **Click on your domain:** `allwaystransfers.com.au`

3. **Wait 5-30 minutes** for DNS propagation

4. **Click "Verify" or "Check DNS"** button (if available)

5. **Status should change from "Pending" to "Verified" ✓**

---

## Step 4: Test Email Sending

Once Resend shows "Verified ✓", create a test quote:

1. Go to your admin panel: [https://allwaystransfers.com.au/admin/quotes](https://allwaystransfers.com.au/admin/quotes)

2. Create a new quote with your email address

3. Check your inbox for the quote email **with PDF attached**

---

## Current Status

✅ Code updated to use `bookings@allwaystransfers.com.au` as sender\
✅ PDF attachment feature added to quote emails\
✅ Changes deployed to production\
❌ **DNS records NOT added** (blocking email delivery)

## DNS Verification Check

You can verify your DNS records are added correctly by running this command:

```bash
# Check DKIM record
dig TXT resend._domainkey.allwaystransfers.com.au +short

# Should return the p=MIGf... value
```

**Current result:** Empty (record not found)\
**Expected result:** The DKIM key value from Resend

---

## Need Help?

If you see more than one DNS record in Resend, or if you have trouble adding them to Hostinger, let me know and I'll help you through it step by step.

**Important:** Make sure you're logged into the same Resend account where you added the domain 3 months ago.