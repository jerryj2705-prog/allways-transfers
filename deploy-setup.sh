#!/bin/bash
# Deployment setup script for Hostinger
cd ~/public_html
rm -f drizzle.config.ts .htaccess
cp env-production .env
rm -f env-production .env.production
ls -la
echo "=== Setup complete ==="
