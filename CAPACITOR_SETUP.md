# Capacitor Setup Guide

This app has been configured to work as a native Android and iOS app using Capacitor.

## 📱 What is Capacitor?

Capacitor is a cross-platform native runtime that allows you to build native mobile apps using web technologies (HTML, CSS, JavaScript/TypeScript). It wraps your web app in a native container, giving you access to native device features.

## 🚀 Quick Start

### Prerequisites

**For Android:**
- Android Studio (latest version)
- Java Development Kit (JDK) 11 or higher
- Android SDK

**For iOS (macOS only):**
- Xcode (latest version)
- CocoaPods (`sudo gem install cocoapods`)
- macOS with Xcode Command Line Tools

### Building and Running

1. **Build the web app for Capacitor:**
   ```bash
   npm run build:capacitor
   ```

2. **Sync web assets to native platforms:**
   ```bash
   npm run cap:sync
   ```
   This command builds the app and copies the web assets to both Android and iOS projects.

3. **Open in native IDE:**
   - **Android:** `npm run cap:open:android` (opens Android Studio)
   - **iOS:** `npm run cap:open:ios` (opens Xcode)

4. **Run on device/emulator:**
   - **Android:** `npm run cap:run:android`
   - **iOS:** `npm run cap:run:ios`

## 📝 Available Scripts

- `npm run build:capacitor` - Build the app with Capacitor flag (disables service workers)
- `npm run cap:sync` - Build and sync web assets to native platforms
- `npm run cap:copy` - Copy web assets without building
- `npm run cap:open:android` - Open Android project in Android Studio
- `npm run cap:open:ios` - Open iOS project in Xcode
- `npm run cap:run:android` - Build, sync, and run on Android
- `npm run cap:run:ios` - Build, sync, and run on iOS

## 🔧 Configuration

### Capacitor Config (`capacitor.config.ts`)

The main configuration file is located at the root:
- `appId`: `com.inthemiddleofallthings.app` - Your app's unique identifier
- `appName`: `In the Middle of All Things` - Display name
- `webDir`: `dist` - Where the built web assets are located

### Platform-Specific Settings

**Android:**
- Minimum SDK: Configured in `android/app/build.gradle`
- Target SDK: Configured in `android/app/build.gradle`
- Permissions: Configured in `android/app/src/main/AndroidManifest.xml`

**iOS:**
- Minimum iOS version: Configured in `ios/App/App.xcodeproj`
- Permissions: Configured in `ios/App/App/Info.plist`

## 🔌 Native Plugins

The following Capacitor plugins are installed and configured:

- **@capacitor/core** - Core Capacitor functionality
- **@capacitor/status-bar** - Control status bar appearance
- **@capacitor/splash-screen** - Manage splash screen

### Adding More Plugins

To add additional Capacitor plugins:

```bash
npm install @capacitor/plugin-name
npx cap sync
```

Popular plugins you might want:
- `@capacitor/camera` - Camera access
- `@capacitor/filesystem` - File system access
- `@capacitor/geolocation` - GPS location
- `@capacitor/push-notifications` - Push notifications
- `@capacitor/share` - Native share dialog
- `@capacitor/storage` - Native key-value storage

## 🛠️ Development Workflow

### 1. Make Changes to Web Code

Edit your React/TypeScript files in `src/` as usual.

### 2. Build and Sync

After making changes:
```bash
npm run cap:sync
```

This will:
- Build your web app
- Copy assets to native projects
- Update native dependencies

### 3. Test in Native IDE

Open the native project and run it:
- Android: Use Android Studio's emulator or connect a device
- iOS: Use Xcode's simulator or connect a device

### 4. Live Reload (Development)

For faster development, you can use Capacitor's live reload:

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Update `capacitor.config.ts` to point to your dev server:
   ```typescript
   server: {
     url: 'http://localhost:5173',
     cleartext: true
   }
   ```

3. Sync:
   ```bash
   npx cap sync
   ```

4. Run the app - changes will reload automatically!

## 📦 Building for Production

### Android

1. **Generate a signed APK/AAB:**
   - Open Android Studio
   - Build → Generate Signed Bundle / APK
   - Follow the wizard to create your release build

2. **Or use Gradle:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

### iOS

1. **Archive and distribute:**
   - Open Xcode
   - Product → Archive
   - Distribute App → App Store Connect / Ad Hoc / Enterprise

2. **Or use command line:**
   ```bash
   cd ios/App
   xcodebuild -workspace App.xcworkspace -scheme App -configuration Release archive
   ```

## 🔍 Important Notes

### Service Workers

Service workers are **automatically disabled** when building for Capacitor. The app detects if it's running in a native environment and skips service worker registration. Updates in native apps are handled through app stores, not service workers.

### PWA Features

Some PWA features work differently in native apps:
- **Install prompt**: Not shown (app is already "installed")
- **Offline caching**: Handled by native file system, not service workers
- **Push notifications**: Use Capacitor's push notification plugin instead

### Platform Detection

The app includes utilities to detect if it's running in Capacitor:

```typescript
import { isCapacitor, getCapacitorPlatform } from './utils/capacitor';

if (isCapacitor()) {
  const platform = getCapacitorPlatform(); // 'ios' | 'android' | 'web'
  // Handle native-specific code
}
```

## 🐛 Troubleshooting

### Android Issues

**Gradle sync fails:**
- Make sure you have the latest Android Studio
- Check that your Java version is compatible
- Try: `cd android && ./gradlew clean`

**Build errors:**
- Check `android/app/build.gradle` for correct SDK versions
- Ensure all dependencies are properly synced: `npx cap sync`

### iOS Issues

**CocoaPods errors:**
- Run: `cd ios/App && pod install`
- If that fails: `pod deintegrate && pod install`

**Build errors:**
- Make sure you have the latest Xcode
- Check that your deployment target is compatible
- Clean build folder: Product → Clean Build Folder

### General Issues

**Changes not appearing:**
- Always run `npm run cap:sync` after building
- Make sure you're building with `npm run build:capacitor` (not just `npm run build`)

**Plugin not working:**
- Make sure you ran `npx cap sync` after installing the plugin
- Check that the plugin is properly imported in your code
- Verify platform-specific configuration files

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [Android Development Guide](https://developer.android.com/)
- [iOS Development Guide](https://developer.apple.com/ios/)

## 🎯 Next Steps

1. **Configure app icons and splash screens:**
   - Android: `android/app/src/main/res/`
   - iOS: `ios/App/App/Assets.xcassets/`

2. **Set up app signing:**
   - Android: Create a keystore for release builds
   - iOS: Configure your Apple Developer account

3. **Add native features:**
   - Install additional Capacitor plugins as needed
   - Configure permissions in platform-specific files

4. **Test on real devices:**
   - Connect physical devices for testing
   - Test on different screen sizes and OS versions

5. **Prepare for app store submission:**
   - Create app store listings
   - Prepare screenshots and descriptions
   - Set up app store accounts (Google Play, App Store)



