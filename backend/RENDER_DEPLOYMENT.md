# DVSlot Render.com Deployment Guide

## 🌟 Why Render.com?

✅ **Free tier includes:**
- 750 hours/month (enough for 24/7 operation)
- Automatic deploys from Git
- Custom domains
- SSL certificates
- Global CDN
- No credit card required

✅ **Perfect for DVSlot because:**
- Handles Node.js apps perfectly
- Integrates with Supabase
- Auto-scaling
- Built-in monitoring
- Zero-downtime deployments

## 🚀 Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 2. Deploy on Render.com
1. Go to [Render.com](https://render.com)
2. Sign up/in with GitHub
3. Click "New +" → "Web Service"
4. Connect your DVSlot repository
5. Use these settings:
   - **Name**: `dvslot-api`
   - **Environment**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3. Environment Variables
Add these in Render dashboard:
- `NODE_ENV` = `production`
- `SUPABASE_URL` = `https://mrqwzdrdbdguuaarjkwh.supabase.co`
- `SUPABASE_ANON_KEY` = `your_supabase_anon_key`
- `CORS_ORIGIN` = `https://dvs-lot.vercel.app`

### 4. Auto-Deploy Setup
- Render automatically deploys when you push to `main`
- No manual intervention needed
- Build logs available in dashboard

## 🔗 Your API URLs
After deployment, your API will be available at:
- **Base URL**: `https://dvslot-api.onrender.com`
- **Health Check**: `https://dvslot-api.onrender.com/health`
- **Test Centers**: `https://dvslot-api.onrender.com/api/test-centers`

## 📱 Update Your Mobile App
Update your mobile app's API base URL:

```javascript
// In your mobile app's API configuration
const API_BASE_URL = 'https://dvslot-api.onrender.com';
```

## 🔄 Free Tier Limits
- **750 hours/month** (enough for continuous operation)
- **Sleeps after 15min inactivity** (wakes up instantly on request)
- **100GB bandwidth/month**
- **500MB memory**

## 🚀 Upgrade Path
If you need more resources:
- **Starter Plan**: $7/month (no sleep, always-on)
- **Standard Plan**: $25/month (more resources)

## ✅ Monitoring & Health Checks
- Built-in health checks at `/health`
- Automatic restarts if unhealthy  
- Real-time logs in dashboard
- Metrics and monitoring included

## 🎉 Benefits for DVSlot
1. **Zero-cost deployment** for development/testing
2. **Professional infrastructure** 
3. **Scales automatically** as users grow
4. **Integrates perfectly** with your Supabase database
5. **Works seamlessly** with your Vercel mobile app

Your DVSlot backend will be production-ready and accessible worldwide!
