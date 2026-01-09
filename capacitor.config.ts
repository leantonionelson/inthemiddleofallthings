import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inthemiddleofallthings.app',
  appName: 'In the Middle of All Things',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Allow localhost in development
    ...(process.env.NODE_ENV === 'development' && {
      url: 'http://localhost:5173',
      cleartext: true
    })
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0F0F0F',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0F0F0F'
    }
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    },
    allowMixedContent: true
  },
  ios: {
    scheme: 'In the Middle of All Things',
    contentInset: 'automatic'
  }
};

export default config;


