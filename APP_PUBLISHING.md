# App Publishing Guide

This guide covers how to publish your Capacitor app to the Google Play Store (Android) and Apple App Store (iOS).

## 📱 Prerequisites

### For Android (Google Play Store)
- Google Play Developer account ($25 one-time fee)
- Signed release build (AAB or APK)

### For iOS (Apple App Store)
- Apple Developer account ($99/year)
- macOS with Xcode
- Signed release build

---

## 🤖 Android - Google Play Store

### Step 1: Generate a Signing Key

1. **Create a keystore file** (if you don't have one):
   ```bash
   cd android/app
   keytool -genkey -v -keystore middle-app-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias middle-app
   ```
   
   You'll be prompted to enter:
   - Password (save this securely!)
   - Your name, organization, etc.
   
   **Important:** Keep this keystore file and password safe! You'll need it for all future updates.

2. **Move the keystore** to a secure location:
   ```bash
   mv middle-app-release-key.jks ../../keystore/
   ```

### Step 2: Configure Signing in Android

1. **Create a `keystore.properties` file** in the `android` directory:
   ```properties
   storePassword=YOUR_STORE_PASSWORD
   keyPassword=YOUR_KEY_PASSWORD
   keyAlias=middle-app
   storeFile=../keystore/middle-app-release-key.jks
   ```

2. **Update `android/app/build.gradle`** to use signing config:
   ```gradle
   android {
       // ... existing config ...
       
       signingConfigs {
           release {
               def keystorePropertiesFile = rootProject.file("../keystore.properties")
               def keystoreProperties = new Properties()
               if (keystorePropertiesFile.exists()) {
                   keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
               }
               
               storeFile file(keystoreProperties['storeFile'] ?: '../keystore/middle-app-release-key.jks')
               storePassword keystoreProperties['storePassword'] ?: ''
               keyAlias keystoreProperties['keyAlias'] ?: 'middle-app'
               keyPassword keystoreProperties['keyPassword'] ?: ''
           }
       }
       
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled false
               proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

3. **Add `keystore.properties` to `.gitignore`**:
   ```
   android/keystore.properties
   keystore/
   *.jks
   ```

### Step 3: Build Release AAB

**Option A: Using Android Studio**
1. Open Android Studio
2. Build → Generate Signed Bundle / APK
3. Select "Android App Bundle"
4. Select your keystore file
5. Enter passwords
6. Click "Create"

**Option B: Using Command Line**
```bash
cd android
./gradlew bundleRelease
```

The AAB file will be at: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 4: Prepare App Store Listing

Before uploading, prepare:
- **App name**: "In the Middle of All Things"
- **Short description** (80 characters max)
- **Full description** (4000 characters max)
- **Screenshots** (at least 2, up to 8):
  - Phone: 16:9 or 9:16, min 320px, max 3840px
  - Tablet: 16:9 or 9:16, min 320px, max 3840px
- **App icon**: 512x512px PNG (no transparency)
- **Feature graphic**: 1024x500px PNG
- **Privacy policy URL** (required)

### Step 5: Upload to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app
3. Fill in store listing details
4. Go to "Production" → "Create new release"
5. Upload your AAB file
6. Add release notes
7. Review and publish

**Review Process**: Usually takes 1-3 days for new apps.

---

## 🍎 iOS - Apple App Store

### Step 1: Configure App in Xcode

1. **Open the iOS project**:
   ```bash
   npm run cap:open:ios
   ```

2. **Set up your Apple Developer account**:
   - Xcode → Settings → Accounts
   - Add your Apple ID
   - Select your team

3. **Configure App ID and Bundle Identifier**:
   - Select the project in Xcode
   - Go to "Signing & Capabilities"
   - Ensure Bundle Identifier matches: `com.inthemiddleofallthings.app`
   - Select your team for "Automatically manage signing"

4. **Update app version**:
   - General tab → Version: `1.0.0`
   - Build: `1`

### Step 2: Configure App Icons and Launch Screen

1. **App Icons**:
   - Go to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Add icons in all required sizes (Xcode will show which ones are missing)

2. **Launch Screen**:
   - Already configured via Capacitor splash screen plugin
   - Can customize in `ios/App/App/Assets.xcassets/`

### Step 3: Build for App Store

1. **Archive the app**:
   - In Xcode: Product → Destination → Any iOS Device
   - Product → Archive
   - Wait for archive to complete

2. **Distribute the app**:
   - In Organizer window, select your archive
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow the wizard:
     - Upload
     - Select your team
     - Automatically manage signing
     - Upload

### Step 4: Prepare App Store Listing

In [App Store Connect](https://appstoreconnect.apple.com):

1. **Create new app**:
   - App name: "In the Middle of All Things"
   - Primary language: English
   - Bundle ID: `com.inthemiddleofallthings.app`
   - SKU: `middle-app-001` (unique identifier)

2. **App Information**:
   - Category: Books, Education, or Lifestyle
   - Age rating (complete questionnaire)
   - Privacy policy URL (required)

3. **Pricing and Availability**:
   - Set price (or free)
   - Select countries

4. **Prepare for Submission**:
   - **Screenshots** (required):
     - iPhone 6.7": 1290 x 2796 pixels
     - iPhone 6.5": 1284 x 2778 pixels
     - iPad Pro 12.9": 2048 x 2732 pixels
   - **App preview** (optional video)
   - **Description**: Up to 4000 characters
   - **Keywords**: Up to 100 characters
   - **Support URL**: Your website
   - **Marketing URL** (optional)

### Step 5: Submit for Review

1. In App Store Connect, go to your app
2. Complete all required sections (red indicators)
3. Create a new version
4. Upload build (if not done via Xcode)
5. Fill in "What's New in This Version"
6. Answer App Review questions
7. Submit for Review

**Review Process**: Usually takes 1-3 days, can be longer for new apps.

---

## 🔄 Updating Your App

### For Android

1. **Update version** in `android/app/build.gradle`:
   ```gradle
   defaultConfig {
       versionCode 2  // Increment by 1
       versionName "1.0.1"  // Your version string
   }
   ```

2. **Build new AAB**:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

3. **Upload to Play Console**:
   - Create new release in Production
   - Upload new AAB
   - Add release notes

### For iOS

1. **Update version** in Xcode:
   - General tab → Version: `1.0.1`
   - Build: `2` (increment)

2. **Build and archive**:
   - Product → Archive
   - Distribute to App Store Connect

3. **Submit update**:
   - In App Store Connect, create new version
   - Select new build
   - Submit for review

---

## 📋 Pre-Submission Checklist

### Both Platforms
- [ ] App tested on real devices
- [ ] All features working correctly
- [ ] No crashes or critical bugs
- [ ] Privacy policy URL ready
- [ ] App icons in all required sizes
- [ ] Screenshots prepared
- [ ] App description written
- [ ] Keywords researched
- [ ] Support contact information ready

### Android Specific
- [ ] Keystore file backed up securely
- [ ] Keystore password saved securely
- [ ] AAB file built and tested
- [ ] Target SDK version appropriate
- [ ] Permissions properly declared

### iOS Specific
- [ ] Apple Developer account active
- [ ] App ID registered
- [ ] Certificates and profiles set up
- [ ] TestFlight testing completed (optional but recommended)
- [ ] App Store guidelines reviewed

---

## 🛠️ Troubleshooting

### Android Issues

**"Keystore file not found"**
- Ensure path in `keystore.properties` is correct
- Use relative path from `android/app/` directory

**"Upload failed: AAB is not signed"**
- Verify signing config in `build.gradle`
- Check keystore passwords are correct

### iOS Issues

**"No signing certificate found"**
- Xcode → Settings → Accounts → Download Manual Profiles
- Or enable "Automatically manage signing"

**"Invalid Bundle Identifier"**
- Ensure it matches your App ID in App Store Connect
- Format: `com.yourcompany.appname`

**"Missing compliance"**
- Answer export compliance questions in App Store Connect
- Usually "No" for encryption questions unless you use custom encryption

---

## 📚 Resources

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Capacitor Deployment Docs](https://capacitorjs.com/docs/guides/deploying)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

## 💡 Tips

1. **Test on real devices** before submitting
2. **Use TestFlight** (iOS) or **Internal Testing** (Android) to test with beta users
3. **Prepare marketing materials** (screenshots, descriptions) in advance
4. **Monitor reviews** and respond to user feedback
5. **Plan updates** - apps need regular updates to stay relevant
6. **Keep keystore safe** - losing it means you can't update your Android app!

Good luck with your app launch! 🚀


