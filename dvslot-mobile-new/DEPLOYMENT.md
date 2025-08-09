# DVSlot Mobile App - Deployment Guide

This guide covers deploying the DVSlot mobile app to various platforms.

## Pre-Deployment Checklist

- [ ] All features tested on target platforms
- [ ] App metadata updated (version, description, etc.)
- [ ] Icons and splash screens optimized
- [ ] Environment variables configured
- [ ] Analytics and error tracking set up
- [ ] Push notifications configured (if needed)

## Web Deployment

### Build for Web
```bash
npx expo build:web
```

### Deploy to Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npx expo build:web
cd dist
netlify deploy --prod
```

### Deploy to Vercel
```bash
# Install Vercel CLI  
npm install -g vercel

# Build and deploy
npx expo build:web
cd dist
vercel --prod
```

## Mobile App Store Deployment

### Setup EAS (Expo Application Services)

1. **Install EAS CLI:**
```bash
npm install -g eas-cli
```

2. **Login to Expo:**
```bash
eas login
```

3. **Configure the project:**
```bash
eas build:configure
```

### iOS App Store

1. **Prerequisites:**
   - Apple Developer Account ($99/year)
   - Valid iOS Distribution Certificate
   - App Store Connect app record

2. **Update `eas.json` with iOS details:**
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

3. **Build for iOS:**
```bash
eas build --platform ios
```

4. **Submit to App Store:**
```bash
eas submit --platform ios
```

### Google Play Store

1. **Prerequisites:**
   - Google Play Developer Account ($25 one-time fee)
   - Google Cloud Service Account
   - Play Console app record

2. **Update `eas.json` with Android details:**
```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

3. **Build for Android:**
```bash
eas build --platform android
```

4. **Submit to Play Store:**
```bash
eas submit --platform android
```

## Environment Configuration

### Production Environment Variables

Create `.env.production` file:
```env
API_BASE_URL=https://api.dvslot.com
ANALYTICS_KEY=your-production-analytics-key
SENTRY_DSN=your-sentry-dsn
NOTIFICATION_KEY=your-notification-service-key
```

### Update app.json for Production

1. **Update version numbers:**
   - Increment `version` in `app.json`
   - Increment `buildNumber` (iOS) and `versionCode` (Android)

2. **Update app metadata:**
   - Ensure proper app name and description
   - Add keywords for app store optimization
   - Set proper privacy policy URL

3. **Configure permissions:**
   - Only request necessary permissions
   - Add permission usage descriptions

## Additional Deployment Steps

### Enable Notifications (Optional)

1. **Install expo-notifications:**
```bash
npx expo install expo-notifications
```

2. **Update app.json:**
```json
{
  "plugins": [
    "expo-router",
    [
      "expo-notifications",
      {
        "icon": "./assets/images/notification-icon.png",
        "color": "#3B82F6"
      }
    ]
  ]
}
```

3. **Configure push notification services:**
   - iOS: Apple Push Notification service (APNs)
   - Android: Firebase Cloud Messaging (FCM)

### App Store Optimization

1. **Prepare App Store Assets:**
   - App screenshots (multiple device sizes)
   - App preview videos
   - App description and keywords
   - Privacy policy URL

2. **iOS App Store Requirements:**
   - 1024x1024 app icon
   - Screenshots for iPhone and iPad
   - App description (up to 4,000 characters)
   - Keywords (100 characters)

3. **Google Play Store Requirements:**
   - 512x512 app icon  
   - Feature graphic (1024x500)
   - Screenshots for phone and tablet
   - Short description (80 characters)
   - Full description (4,000 characters)

### Monitoring and Analytics

1. **Add Expo Application Services:**
   - Automatic crash reporting
   - Performance monitoring
   - User analytics

2. **Add Third-party Services:**
   - Google Analytics for Firebase
   - Sentry for error tracking
   - Mixpanel for user analytics

## Testing Before Release

### Internal Testing
```bash
# Build preview versions
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

### Beta Testing
- iOS: TestFlight (up to 10,000 testers)
- Android: Play Console Internal Testing

### Production Testing
- Test on multiple devices and OS versions
- Verify all app functionality works
- Test notification delivery
- Verify app store listings

## Post-Deployment

1. **Monitor App Performance:**
   - Crash rates and error logs
   - User engagement metrics
   - App store ratings and reviews

2. **Regular Updates:**
   - Bug fixes and security patches
   - New feature releases
   - OS compatibility updates

3. **User Support:**
   - Monitor user feedback
   - Respond to app store reviews
   - Provide customer support channels

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check compatibility matrix for Expo SDK
   - Verify all dependencies are compatible
   - Clear cache: `expo r -c`

2. **App Store Rejection:**
   - Review Apple/Google guidelines
   - Ensure proper permission descriptions
   - Test thoroughly on target devices

3. **Performance Issues:**
   - Optimize bundle size
   - Implement code splitting
   - Use Expo Application Services for monitoring

### Support Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://support.google.com/googleplay/android-developer/answer/9899234)

## Deployment Commands Summary

```bash
# Web deployment
npx expo build:web

# Mobile builds
eas build --platform ios
eas build --platform android
eas build --platform all

# App store submissions
eas submit --platform ios
eas submit --platform android

# Preview builds
eas build --profile preview --platform all
```
