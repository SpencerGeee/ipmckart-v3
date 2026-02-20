# IPMC Kart Native Mobile Apps (Capacitor)

This project is now configured to build native Android and iOS applications using Capacitor.js.

## Prerequisites
- **Node.js**: v18+
- **Android**: Android Studio installed and configured with SDK.
- **iOS**: macOS with Xcode installed (requires CocoaPods).

## Local Development Flow
1. **Sync web changes to native projects**:
   ```bash
   npx cap copy
   ```

2. **Open projects in IDEs**:
   ```bash
   # Open Android Studio
   npx cap open android

   # Open Xcode
   npx cap open ios
   ```

## Building for Production

### Android (Google Play Store)
1. Open Android Studio: `npx cap open android`.
2. Go to **Build > Generate Signed Bundle / APK**.
3. Follow the wizard to create a Keystore and sign your app.
4. Upload the generated `.aab` file to Google Play Console.

### iOS (Apple App Store)
1. Open Xcode: `npx cap open ios`.
2. Select **App** target and choose a **Provisioning Profile** in "Signing & Capabilities".
3. Set the build target to **Any iOS Device (arm64)**.
4. Go to **Product > Archive**.
5. Once archived, use the **Distribute App** button to upload to App Store Connect.

## Key Configurations
- **App ID**: `com.ipmckart.app`
- **Web Dir**: `www` (Contains minified and bundled web assets)
- **Native Bridge**: `assets/js/native-bridge.js` (Handles Push, Splash, and Status Bar)

## Troubleshooting
- If native plugins are not detected, run: `npx cap sync`.
- For iOS build errors, ensure CocoaPods is up to date: `cd ios/App && pod install`.
