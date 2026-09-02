# Shield — store submission

## Files this repo builds
- Windows portable `.exe` (Electron)
- Mac `.zip` of Shield.app (sign on a Mac with your Apple Developer ID)
- Linux AppImage
- Android APK / AAB (Capacitor, Play Console)
- iOS Xcode project (archive on a Mac → App Store Connect)
- Chrome Web Store zip
- Firefox Add-ons zip

## Chrome Web Store
1. Zip `extension-chrome/`
2. https://chrome.google.com/webstore/devconsole
3. Upload zip, privacy policy: https://memetorrent.futuret3ch.com.au/shield/help/privacy

## Firefox
1. Zip `extension-firefox/`
2. https://addons.mozilla.org/developers/

## Google Play
1. Open `android/` in Android Studio or `./gradlew bundleRelease`
2. Upload the `.aab` in Play Console
3. Package: `au.com.futuret3ch.shield`

## Apple App Store
Must be done on a Mac with Xcode and an Apple Developer account ($99/yr).
1. `npx cap open ios`
2. Signing & Capabilities → your Team
3. Product → Archive → Distribute App
4. App Store Connect listing, privacy nutrition labels

Linux CI cannot produce a signed IPA. The `ios/` folder is the submit-ready project.

## Windows / Mac desktop
Sign the Electron build with:
- Windows: Authenticode certificate
- Mac: Developer ID Application + notarize
Unsigned builds still run (Mac: right-click Open).
