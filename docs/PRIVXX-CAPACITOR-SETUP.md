# Privxx — Capacitor Native App Setup Guide

**Purpose:** Package Privxx as native iOS and Android apps for App Store / Play Store distribution.

---

## Prerequisites

| Requirement | iOS | Android |
|-------------|-----|---------|
| Operating System | macOS only | macOS, Windows, or Linux |
| IDE | Xcode (latest) | Android Studio |
| Developer Account | Apple Developer ($99/year) | Google Play ($25 one-time) |

---

## Step 1: Export to GitHub

1. In Lovable, click **Settings → GitHub → Export to GitHub**
2. Clone the repository locally:
   ```bash
   git clone <your-repo-url>
   cd privxx
   ```

---

## Step 2: Install Dependencies

```bash
npm install
```

Install Capacitor packages:
```bash
npm install @capacitor/core @capacitor/ios @capacitor/android
npm install -D @capacitor/cli
```

---

## Step 3: Initialize Capacitor

```bash
npx cap init
```

When prompted:
- **App ID:** `app.lovable.3500335c5fb2424887b92a66fadc526f`
- **App Name:** `privxx`

---

## Step 4: Configure capacitor.config.ts

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.3500335c5fb2424887b92a66fadc526f',
  appName: 'privxx',
  webDir: 'dist',
  server: {
    // Development only — remove for production builds
    url: 'https://3500335c-5fb2-4248-87b9-2a66fadc526f.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
```

> **Note:** Remove the `server` block for production App Store builds.

---

## Step 5: Add Native Platforms

```bash
# Add iOS (macOS only)
npx cap add ios

# Add Android
npx cap add android
```

---

## Step 6: Build and Sync

```bash
npm run build
npx cap sync
```

Run `npx cap sync` after every `git pull` to sync web changes to native projects.

---

## Step 7: Run on Device/Emulator

**iOS (requires Mac + Xcode):**
```bash
npx cap run ios
```

**Android (requires Android Studio):**
```bash
npx cap run android
```

---

## App Store Preparation

### iOS (App Store Connect)

1. Open `ios/App/App.xcworkspace` in Xcode
2. Set signing team and bundle identifier
3. Archive and upload via Xcode Organizer
4. Complete App Store Connect listing

### Android (Google Play Console)

1. Open `android/` folder in Android Studio
2. Generate signed APK/AAB: Build → Generate Signed Bundle
3. Upload to Google Play Console
4. Complete store listing

---

## Privacy Compliance Checklist

Before submission, verify:

- [ ] No analytics or tracking code
- [ ] No persistent identifiers
- [ ] Privacy policy URL configured
- [ ] Demo mode clearly labeled (if applicable)
- [ ] App Store privacy nutrition labels accurate

---

## Recommended Capacitor Plugins (Future)

| Plugin | Purpose |
|--------|---------|
| `@capacitor/push-notifications` | Privacy-preserving notifications |
| `@capacitor/secure-storage` | Encrypted local storage |
| `@capacitor/biometrics` | Secure authentication |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| iOS build fails | Ensure Xcode Command Line Tools installed |
| Android SDK missing | Install via Android Studio SDK Manager |
| Hot reload not working | Verify `server.url` in capacitor.config.ts |
| Sync fails | Run `npx cap update ios` or `npx cap update android` |

---

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Lovable Capacitor Guide](https://docs.lovable.dev)
- [Apple App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/console/about/guides/releasewithconfidence/)

---

**Status:** Documentation ready — Execute when backend integration is stable.
