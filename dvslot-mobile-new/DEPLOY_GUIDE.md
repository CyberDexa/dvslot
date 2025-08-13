# DVSlot Web - Production Deployment Guide

## Quick Deploy

The web app is built and ready for deployment. Here's how to deploy it live:

### Option 1: Automatic Deploy (Recommended)
```bash
cd dvslot-mobile-new
./deploy-live.sh
```

### Option 2: Manual Deploy
```bash
cd dvslot-mobile-new

# Build the app
npm run build:web

# Deploy to Vercel (you'll be prompted to login on first use)
vercel --prod --yes
```

## What's Deployed

✅ **Web App Features:**
- Supabase auth (login/signup) 
- Search with 318 UK test centers
- Real-time slot search with 2-hour freshness
- Alert creation via backend integration
- Mobile-responsive design

✅ **Production Configuration:**
- CSP allows backend API and postcode lookup
- Environment variables set for production
- Static export optimized for Vercel

✅ **Backend Integration:**
- CORS updated to allow *.vercel.app domains
- JWT-based alerts system
- Health check endpoint

## Testing Your Deployment

1. **Authentication Test:**
   - Visit `/auth/login` and `/auth/signup`
   - Should work with Supabase (no hanging)

2. **Search Test:**
   - Go to search tab or `/two`
   - Enter a UK postcode (e.g., "SW1A 1AA")
   - Should return results within seconds
   - No infinite loading

3. **Alerts Test:**
   - Use "Set Alert" on any slot
   - Will prompt to connect backend via `/auth/backend-login`
   - Backend should be accessible from your Vercel domain

## Environment Variables

The following are set in `.env.production`:
- `EXPO_PUBLIC_SUPABASE_URL` → Production Supabase
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` → Anon key
- `EXPO_PUBLIC_API_BASE_URL` → https://dvslot-api.onrender.com
- `EXPO_PUBLIC_WEB_URL` → Your Vercel URL

## Backend Status

The backend at https://dvslot-api.onrender.com should auto-deploy from GitHub.
- CORS now allows your Vercel domain
- Health check: https://dvslot-api.onrender.com/health

## Troubleshooting

- **CORS errors**: Wait 2-3 minutes for backend deployment
- **Auth not working**: Check browser console for CSP violations
- **Search hanging**: Should be fixed with timeout/fallback logic

Ready to deploy! 🚀
