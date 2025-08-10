# DVSlot - Vercel Web Deployment Guide

This guide will help you deploy the DVSlot web application to Vercel.

## 🚀 Prerequisites

1. **Vercel Account**: Create a free account at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your DVSlot code should be in a GitHub repository
3. **Supabase Project**: Your Supabase database should be set up and running

## 📋 Step-by-Step Deployment

### 1. Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### 2. Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Click "New Project"**
3. **Import from GitHub**: Select your DVSlot repository
4. **Configure Project**:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build:web`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3. Environment Variables Setup

In your Vercel project settings, add these environment variables:

#### Required Variables:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_WEB_URL=https://your-project.vercel.app
EXPO_PUBLIC_API_BASE_URL=https://your-project.vercel.app
```

#### Optional Variables:
```
EXPO_PUBLIC_APP_NAME=DVSlot
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_ENABLE_LOCATION_TRACKING=true
EXPO_PUBLIC_ENABLE_NOTIFICATIONS=true
```

### 4. Domain Configuration (Optional)

1. **Custom Domain**: Go to Project Settings → Domains
2. **Add your custom domain** (e.g., `dvslot.com`)
3. **Configure DNS** as instructed by Vercel

## 🔧 Alternative: Deploy via CLI

```bash
# Clone your repository
git clone https://github.com/your-username/dvslot.git
cd dvslot/dvslot-mobile-new

# Install dependencies
npm install

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## 📱 Testing Your Deployment

1. **Visit your deployed URL**
2. **Test authentication**: Sign up and sign in
3. **Test search functionality**: Search for test centers
4. **Test responsive design**: Check mobile and desktop views
5. **Test profile management**: Create and manage user profiles

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Ensure all environment variables are set
   - Check that Supabase credentials are correct

2. **Authentication Issues**:
   - Verify Supabase URL and keys
   - Check Supabase project settings

3. **Styling Issues**:
   - Clear browser cache
   - Check CSS compatibility

### Build Logs:
Check Vercel build logs in your dashboard for specific error messages.

## 🚀 Post-Deployment

1. **Update Supabase Settings**:
   - Add your Vercel domain to allowed origins
   - Configure redirect URLs for authentication

2. **Monitor Performance**:
   - Use Vercel Analytics
   - Monitor user feedback

3. **Set up CI/CD**:
   - Enable automatic deployments on git push
   - Set up preview deployments for pull requests

## 📊 Production Checklist

- [ ] Environment variables configured
- [ ] Supabase RLS policies applied
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Performance monitoring enabled
- [ ] Error tracking configured
- [ ] User authentication tested
- [ ] Database queries working
- [ ] Responsive design verified

## 🎯 Expected Performance

- **First Load**: < 3 seconds
- **Navigation**: < 500ms
- **Search Results**: < 2 seconds
- **Authentication**: < 1 second

Your DVSlot web application will be live and ready for users to find driving test slots! 🇬🇧

## 🆘 Support

If you encounter issues:
1. Check Vercel build logs
2. Verify environment variables
3. Test Supabase connection
4. Check browser console for errors

---

**Happy Deploying! 🚀**
