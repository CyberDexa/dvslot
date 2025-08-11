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
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  console.log('🌐 DVSlot: Applying web mobile configuration...');
  
  // Add viewport meta tag
  const existingViewport = document.querySelector('meta[name="viewport"]');
  if (existingViewport) {
    existingViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  } else {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    document.head.appendChild(viewport);
  }
  
  // Enable smooth scrolling on web
  const style = document.createElement('style');
  style.id = 'dvslot-mobile-config';
  style.textContent = `
    html {
      height: 100%;
      overflow-x: hidden;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    
    body {
      height: 100%;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      font-size: 16px !important;
    }
    
    #root, #__next {
      height: 100%;
      overflow-x: hidden;
      position: relative;
    }
    
    * {
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    
    input, textarea, button, select {
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      -webkit-user-select: text;
      -khtml-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
      user-select: text;
      touch-action: manipulation;
    }
    
    /* Scrollable areas */
    [data-testid*="scroll"], 
    .scroll-view, 
    .scrollable {
      -webkit-overflow-scrolling: touch;
      overflow-y: auto;
      touch-action: pan-y;
    }
    
    @media (max-width: 768px) {
      body {
        font-size: 16px !important;
        -webkit-text-size-adjust: none;
      }
      
      input {
        font-size: 16px !important;
      }
    }
  `;
  
  // Remove existing style if it exists
  const existingStyle = document.getElementById('dvslot-mobile-config');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  document.head.appendChild(style);
  
  console.log('✅ DVSlot: Mobile web configuration applied successfully');
}
