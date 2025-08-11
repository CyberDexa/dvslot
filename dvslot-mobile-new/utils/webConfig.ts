import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

// Add to app.json or index.html meta tags for web responsiveness
export const webConfig = {
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: 'no',
  },
  touchAction: 'manipulation',
};

// Fix for web scrolling issues
if (Platform.OS === 'web') {
  // Enable smooth scrolling on web
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      height: 100%;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }
    
    * {
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    
    input, textarea {
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
    }
    
    @media (max-width: 768px) {
      body {
        font-size: 16px !important;
      }
    }
  `;
  document.head.appendChild(style);
}
