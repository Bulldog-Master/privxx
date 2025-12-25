# 📱 PRIVXX CAPACITOR MIGRATION GUIDE — REFERENCE

**Status:** FUTURE (Do not execute until backend is stable)  
**Purpose:** Step-by-step native app setup when ready

---

## PREREQUISITES

Before starting Capacitor migration:

- [ ] Backend edge functions deployed and working
- [ ] Mock mode can be toggled OFF
- [ ] Real backend calls succeed end-to-end
- [ ] PWA tested and stable

---

## PHASE 1: LOCAL SETUP

### 1.1 Install Dependencies

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
```

### 1.2 Initialize Capacitor

```bash
npx cap init
```

Configuration values:
- **App ID:** `app.lovable.privxx` (or `dev.privxx.app`)
- **App Name:** Privxx

### 1.3 Update capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.privxx',
  appName: 'Privxx',
  webDir: 'dist',
  server: {
    // For development: point to sandbox URL
    // url: 'https://your-sandbox-url.lovableproject.com?forceHideBadge=true',
    // cleartext: true,
    
    // For production: comment out server block entirely
  }
};

export default config;
```

---

## PHASE 2: PLATFORM SETUP

### 2.1 Add Platforms

```bash
npx cap add ios
npx cap add android
```

### 2.2 Build and Sync

```bash
npm run build
npx cap sync
```

### 2.3 Open in IDE

```bash
# iOS (requires Mac + Xcode)
npx cap open ios

# Android (requires Android Studio)
npx cap open android
```

---

## PHASE 3: NATIVE CONFIGURATION

### 3.1 iOS (Xcode)

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select your development team
3. Update bundle identifier if needed
4. Configure app icons in Assets.xcassets
5. Set deployment target (iOS 14+)

### 3.2 Android (Android Studio)

1. Open `android/` folder in Android Studio
2. Update `app/build.gradle` if needed
3. Configure app icons in `res/mipmap-*`
4. Set min SDK (API 24+)

---

## PHASE 4: NATIVE FEATURES (OPTIONAL)

### 4.1 Status Bar

```bash
npm install @capacitor/status-bar
npx cap sync
```

```typescript
import { StatusBar, Style } from '@capacitor/status-bar';

// Dark status bar for Privxx
StatusBar.setStyle({ style: Style.Dark });
StatusBar.setBackgroundColor({ color: '#0a0a0a' });
```

### 4.2 Splash Screen

```bash
npm install @capacitor/splash-screen
npx cap sync
```

### 4.3 App (Lifecycle)

```bash
npm install @capacitor/app
npx cap sync
```

```typescript
import { App } from '@capacitor/app';

App.addListener('backButton', ({ canGoBack }) => {
  if (!canGoBack) {
    App.exitApp();
  } else {
    window.history.back();
  }
});
```

---

## PHASE 5: BUILD & TEST

### 5.1 Development Testing

```bash
# Run on connected device or emulator
npx cap run ios
npx cap run android
```

### 5.2 Production Build

**iOS:**
1. Archive in Xcode
2. Distribute to App Store Connect

**Android:**
1. Build signed APK/AAB in Android Studio
2. Upload to Google Play Console

---

## APP STORE REQUIREMENTS

### Apple App Store

- [ ] App icons (all sizes)
- [ ] Screenshots (6.5", 5.5", iPad)
- [ ] Privacy policy URL
- [ ] App description
- [ ] Age rating questionnaire
- [ ] Review notes explaining cMixx

### Google Play Store

- [ ] App icons (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone, tablet)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Data safety section

---

## PRIVACY CONSIDERATIONS

### For App Store Review

Prepare clear explanation:
- "Privxx uses the XX Network mixnet for metadata-private communication"
- "No user data is collected, stored, or transmitted to third parties"
- "All network traffic is routed through post-quantum encrypted channels"

### For Data Safety (Google Play)

- Data collected: None
- Data shared: None
- Security practices: Encrypted in transit

---

## SYNC WORKFLOW

After pulling code changes:

```bash
git pull
npm install
npm run build
npx cap sync
```

Then rebuild in Xcode/Android Studio.

---

## TROUBLESHOOTING

### iOS Simulator Issues
```bash
npx cap sync ios
# If still failing:
cd ios && pod install && cd ..
```

### Android Gradle Issues
```bash
cd android && ./gradlew clean && cd ..
npx cap sync android
```

### Hot Reload (Dev Only)
Enable in `capacitor.config.ts`:
```typescript
server: {
  url: 'https://your-sandbox.lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

---

## TIMELINE TRIGGER

**Start Capacitor migration when:**

1. ✅ Edge functions deployed
2. ✅ Backend stable for 1+ week
3. ✅ Mock mode OFF works end-to-end
4. ✅ PWA tested on iOS + Android

**Do not start if:**
- Backend still unstable
- Edge functions not deployed
- Mock mode still required

---

*END OF DOCUMENT — Execute only when prerequisites are met*
