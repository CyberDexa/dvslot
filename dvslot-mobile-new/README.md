# DVSlot - Driving Test Slot Finder

A React Native mobile app built with Expo that helps users find available driving test slots and get notified when new slots become available.

## Features

- 🏠 **Home Dashboard**: Quick access to key features and recent activity
- 🔍 **Smart Search**: Find test slots by postcode and radius
- 🔔 **Alert System**: Get notified about new slots and cancellations  
- 👤 **User Profile**: Manage personal information and preferences
- 📱 **Cross-Platform**: Works on iOS, Android, and Web

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dvslot/mobile-app.git
cd mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Use the Expo Go app on your phone to scan the QR code, or run on simulator:
```bash
npm run ios     # iOS simulator
npm run android # Android emulator  
npm run web     # Web browser
```

## Development Scripts

- `npm start` - Start Expo development server
- `npm run web` - Run in web browser
- `npm run ios` - Run iOS simulator
- `npm run android` - Run Android emulator
- `npm test` - Run tests
- `npm run build` - Build for production

## Deployment

### Web Deployment

1. Build for web:
```bash
npm run build:web
```

2. Deploy the `dist` folder to your hosting provider (Netlify, Vercel, etc.)

### Mobile App Deployment

#### Using EAS Build (Recommended)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Configure EAS project:
```bash
eas login
eas build:configure
```

3. Build for production:
```bash
# iOS
npm run build:ios

# Android
npm run build:android

# Both platforms
npm run build
```

4. Submit to app stores:
```bash
npm run submit:ios
npm run submit:android
```

## Project Structure

```
app/
├── (tabs)/              # Tab navigation screens
│   ├── index.tsx        # Home screen
│   ├── two.tsx          # Search screen  
│   ├── profile.tsx      # Profile screen
│   └── _layout.tsx      # Tab layout configuration
├── modal.tsx            # Alerts modal
├── _layout.tsx          # Root layout
└── +not-found.tsx       # 404 page

assets/                  # Images, fonts, etc.
components/              # Reusable components
constants/               # App constants
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
API_BASE_URL=https://api.dvslot.com
NOTIFICATION_API_KEY=your-notification-key
ANALYTICS_KEY=your-analytics-key
```

### App Configuration

Main app settings are in `app.json`:

- App name, version, and metadata
- Platform-specific configurations
- Plugin configurations
- Build settings

## Features Overview

### Home Screen
- Welcome message and app overview
- Quick action buttons for main features
- Recent activity and statistics

### Search Screen  
- Postcode-based location search
- Configurable search radius (5-50 miles)
- Smart filtering and sorting options
- Search tips and guidance

### Profile Screen
- Personal information management
- Notification preferences
- Preferred test centers
- App settings and logout

### Alerts Modal
- Push notification settings
- Email notification preferences
- Recent alerts with timestamps
- Alert type categorization

## Technical Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Language**: TypeScript
- **Styling**: StyleSheet (React Native)
- **Icons**: Expo Vector Icons
- **Notifications**: Expo Notifications
- **Build System**: EAS Build

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

Run the test suite:
```bash
npm test
```

Run tests in CI mode:
```bash
npm run test:ci
```

## Deployment Checklist

- [ ] Update version number in `package.json` and `app.json`
- [ ] Test on all target platforms (iOS, Android, Web)
- [ ] Update app store screenshots and descriptions
- [ ] Configure environment variables for production
- [ ] Set up analytics and crash reporting
- [ ] Test push notifications
- [ ] Verify API endpoints are production-ready
- [ ] Review and update privacy policy
- [ ] Submit for app store review

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Email: support@dvslot.com  
- Website: https://dvslot.com
- GitHub Issues: https://github.com/dvslot/mobile-app/issues
