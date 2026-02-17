# GlucoTrack AI - Setup Instructions

## Current Issue
The TurboModuleRegistry error occurs because of package version mismatches between Expo SDK 54 and installed packages.

## Solution Options:

### Option 1: Test Simple Version (Current)
The app is now simplified to test basic functionality. Reload your Expo Go app to see if it loads.

### Option 2: Update Expo Go App
1. Open Play Store on your Android device  
2. Search for "Expo Go"
3. Update to the latest version
4. Rescan the QR code

### Option 3: Create Development Build (Recommended for Production)
For full functionality with all native modules, create a custom development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build development client
eas build --profile development --platform android

# After build completes, install the APK and run:
npx expo start --dev-client
```

### Option 4: Fresh Project with Correct Versions
If issues persist, create a new Expo 54 project and migrate:

```bash
npx create-expo-app@latest GlucoTrackNew --template blank-typescript
cd GlucoTrackNew
npm install
```

Then copy over the src folder and update package.json dependencies.

## Next Steps
1. Try reloading in Expo Go (shake device → Reload)
2. If error persists, update Expo Go app
3. For production, use EAS Build to create a development client

## Notes
- The simplified App.tsx is currently active for testing
- All screens and components are complete and ready
- Supabase config still needs API keys in src/constants/Config.ts
