# Android Build Guide for Fantasy Cricket

This guide explains how to build the Fantasy Cricket PWA as an Android app for the Google Play Store.

## Prerequisites

1. **Android Studio** - Download from https://developer.android.com/studio
2. **Java JDK 17+** - Required for Android builds
3. **Node.js 18+** - Already installed for this project

## Initial Setup

### 1. Add Android Platform

```bash
# Initialize Capacitor (if not already done)
npx cap init "Fantasy Cricket" app.fantasycricket.pwa --web-dir=out

# Add Android platform
npx cap add android
```

### 2. Configure Next.js for Static Export

For Capacitor, we need static export. Add to `next.config.ts`:

```typescript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Required for static export
  },
};
```

## Building the Android App

### 1. Build and Sync

```bash
# Build the Next.js app and sync with Android
npm run android
```

Or step by step:

```bash
# 1. Build Next.js as static site
npm run build

# 2. Sync web assets to Android
npx cap sync android

# 3. Open in Android Studio
npx cap open android
```

### 2. Generate Signed APK/AAB

In Android Studio:

1. Go to **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle** (for Play Store) or **APK** (for testing)
3. Create or select your keystore:
   - Store path: Keep in a secure location
   - Store password: Remember this!
   - Key alias: `fantasy-cricket`
   - Key password: Remember this!
4. Select **release** build variant
5. Click **Create**

## Play Store Submission

### Required Assets

1. **App Icon**
   - 512x512 PNG (Hi-res icon)
   - Adaptive icon layers for Android 8+

2. **Screenshots**
   - At least 2 screenshots (phone)
   - 7-inch tablet (recommended)
   - 10-inch tablet (recommended)

3. **Feature Graphic**
   - 1024x500 PNG

4. **Short Description**
   - Max 80 characters

5. **Full Description**
   - Max 4000 characters

### Sample Store Listing

**Short Description:**
Play fantasy cricket with live scoring for IPL, International & CPL matches!

**Full Description:**
```
Fantasy Cricket is the ultimate fantasy sports app for cricket fans! Build your dream team, compete in contests, and track live scores.

🏏 FEATURES:
• Create fantasy teams for IPL, International, CPL, and custom leagues
• Live match scoring with real-time points updates
• Join free contests and compete on leaderboards
• Detailed player statistics and performance tracking
• Push notifications for match updates
• Works offline (PWA)

🎯 HOW TO PLAY:
1. Select a match
2. Build your dream team of 11 players within budget
3. Choose your Captain (2x points) and Vice-Captain (1.5x points)
4. Join contests and compete with friends
5. Track your team's performance live during matches

📊 SCORING:
• Runs, wickets, catches, and more
• Bonus points for milestones (50s, 100s, hat-tricks)
• Real-time scoring updates during live matches

💯 FREE TO PLAY:
This app is completely free with no in-app purchases or gambling. Just pure fantasy cricket fun!

Download now and start building your championship team!
```

### Privacy Policy

You'll need a privacy policy URL. Host one at your domain, e.g.:
`https://fantasycricket.app/privacy`

Include:
- What data is collected (email, team selections)
- How it's used (game functionality)
- Third-party services (Supabase, Cricket APIs)
- Data retention and deletion policy

## App Signing

### Option 1: Google Play App Signing (Recommended)

Let Google manage your app signing key:
1. Enroll in Play App Signing in Play Console
2. Upload your upload key (separate from signing key)
3. Google signs the final APK

### Option 2: Self-Signing

Keep your keystore secure:
```bash
# Store in a safe location, NOT in git
android/app/release-keystore.jks
```

Add to `.gitignore`:
```
android/app/release-keystore.jks
android/key.properties
```

## Testing

### Local Testing

```bash
# Run on connected device or emulator
npx cap run android
```

### Internal Testing

1. Create an Internal Testing track in Play Console
2. Upload AAB
3. Add testers by email
4. Testers get Play Store link

### Pre-launch Report

Google automatically tests your app on real devices. Check for:
- Crashes
- ANRs (App Not Responding)
- Security vulnerabilities
- Accessibility issues

## Versioning

Update version in:

1. `package.json`:
```json
{
  "version": "1.0.0"
}
```

2. `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode 1
        versionName "1.0.0"
    }
}
```

## Troubleshooting

### Build Fails

```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npx cap sync android
```

### White Screen on Launch

Check that `out/` directory contains the static export:
```bash
ls out/
# Should have index.html and other files
```

### Capacitor Plugin Issues

```bash
npx cap doctor
```

## Useful Commands

```bash
# Check Capacitor setup
npx cap doctor

# Sync web assets to native
npx cap sync

# Open in Android Studio
npx cap open android

# Run on device/emulator
npx cap run android

# Build AAB for production
cd android && ./gradlew bundleRelease
```
