# DVSlot Vercel Deployment - Quick Start Guide

## 🚀 Ready to Deploy? Follow these steps:

### 1. **Verify Your Build Works**
```bash
cd F:/DVslot/dvslot-mobile-new
npm run build:web
```

### 2. **Deploy Options**

#### Option A: Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your GitHub repository (root directory)
4. Configure:
   - Framework: **Other**
   - Build Command: `cd dvslot-mobile-new && npm install && npm run build:web`
   - Output Directory: `dvslot-mobile-new/dist`
   - Install Command: `cd dvslot-mobile-new && npm install`

#### Option B: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### 3. **Environment Variables (CRITICAL)**
Add these in Vercel dashboard → Settings → Environment Variables:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_WEB_URL=https://your-project.vercel.app
EXPO_PUBLIC_API_BASE_URL=https://your-project.vercel.app
EXPO_PUBLIC_APP_NAME=DVSlot
EXPO_PUBLIC_ENVIRONMENT=production
```

### 4. **Post-Deployment Setup**

#### Update Supabase (Important!)
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to:
   - **Site URL**: `https://your-project.vercel.app`
   - **Redirect URLs**: `https://your-project.vercel.app/**`

#### Test Your Deployment
- [ ] Visit your deployed URL
- [ ] Test user sign up/login
- [ ] Test test center search
- [ ] Check mobile responsiveness
- [ ] Verify profile management

### 5. **Expected URLs**
Your DVSlot app will be available at:
- **Main App**: `https://your-project.vercel.app`
- **Search**: `https://your-project.vercel.app/two`
- **Profile**: `https://your-project.vercel.app/profile`
- **Login**: `https://your-project.vercel.app/auth/login`

## 🎯 Current Build Status:
✅ Web build successful (exported to `dist/`)
✅ Static routes generated (10 routes)
✅ Bundle size: ~1.72 MB main bundle
✅ All components ready for production

## 🔗 Your App Features:
- **168 UK test centers** in database
- **Real-time authentication** with Supabase
- **Responsive design** for all devices
- **Production-ready** profile management
- **Cross-platform compatibility**

---
**🚀 Ready to launch! Your DVSlot web app will help users across the UK find driving test slots faster than ever!** 🇬🇧
