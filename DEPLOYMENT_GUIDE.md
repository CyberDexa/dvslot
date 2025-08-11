# 🚀 DVSlot Backend Deployment Guide

## Quick Deploy to Railway (Recommended)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway
```bash
railway login
```

### Step 3: Create Project
```bash
cd F:/DVslot/backend
railway init
```

### Step 4: Deploy
```bash
railway up
```

### Step 5: Set Environment Variables (in Railway Dashboard)
- `NODE_ENV` = `production`
- `SUPABASE_URL` = `https://woyivlvtvfwrnlbwydhr.supabase.co`
- `SUPABASE_SERVICE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndveWl2bHZ0dmZ3cm5sYnd5ZGhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjU1OTU5MywiZXhwIjoyMDUyMTM1NTkzfQ.5e6gWIJUwKI8b0MwsPX2RCGuvEGEU6wJWz9PnYP8QTI`
- `SCRAPING_DELAY_MIN` = `5000`
- `SCRAPING_DELAY_MAX` = `15000`
- `MAX_CONCURRENT_SCRAPERS` = `2`

## Alternative: Deploy to Render (Free Tier)

1. Go to https://render.com
2. Connect your GitHub repository
3. Create new Web Service
4. Select `backend` folder as root directory
5. Set build command: `npm install`
6. Set start command: `npm start`
7. Add environment variables from above list

## Alternative: One-Click Heroku Deploy

1. Run the deployment script:
```bash
cd F:/DVslot/backend
chmod +x deploy-heroku.sh
./deploy-heroku.sh
```

## What Happens After Deployment:

### ✅ Automatic DVSA Scraping Schedule:
- **Business Hours**: Every 30 minutes (8AM-6PM, Mon-Fri)
- **Peak Times**: Every 10 minutes (7-9AM, 5-7PM)
- **Weekends**: Every 2 hours (9AM-5PM)
- **Daily Cleanup**: 2AM daily

### 📊 API Endpoints Available:
- `GET /health` - Service health check
- `POST /api/scrape` - Manual scraping trigger
- `GET /api/stats` - Scraping statistics

### 🔍 Monitoring:
- Check logs: `railway logs` (or platform equivalent)
- Health endpoint: `https://your-app.railway.app/health`
- Statistics: `https://your-app.railway.app/api/stats`

### 📱 Mobile App Integration:
Your mobile app will automatically get real DVSA data instead of demo data. No changes needed to the mobile app - it will automatically receive live scraped slots from the deployed backend!

## 🎯 Expected Results:

Within 30 minutes of deployment:
- ✅ Backend scraping 168 UK test centers
- ✅ Real DVSA slots stored in Supabase
- ✅ Mobile app showing live data instead of demo data
- ✅ Automated alerts when new slots become available
- ✅ 24/7 operation with smart scheduling

## 💡 Pro Tips:

1. **Monitor Success Rate**: Check `/api/stats` regularly
2. **Adjust Delays**: If success rate drops below 90%, increase delays
3. **Scale Resources**: More concurrent scrapers = faster updates but higher risk of blocking
4. **UK Timezone**: Server runs on UTC, scheduled for UK business hours
5. **Backup Strategy**: Database automatically backed up in Supabase

## 🆘 Troubleshooting:

**Low Success Rate (< 90%)**:
- Increase `SCRAPING_DELAY_MIN` and `SCRAPING_DELAY_MAX`
- Reduce `MAX_CONCURRENT_SCRAPERS` to 1

**No Slots Found**:
- Check if DVSA website structure changed
- Verify Supabase connection in logs
- Test manual scraping: `POST /api/scrape`

**High Memory Usage**:
- Reduce `MAX_CONCURRENT_SCRAPERS`
- Restart service periodically

Ready to deploy? Choose your platform and follow the steps above! 🚀
