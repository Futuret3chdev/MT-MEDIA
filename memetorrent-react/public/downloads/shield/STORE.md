# Shield store files

See https://memetorrent.futuret3ch.com.au/shield/downloads

## Google Play
- Sideload APK: Shield-android.apk
- Store listing: open shield-native/android in Android Studio → Generate Signed Bundle
- Application ID: au.com.futuret3ch.shield

## App Store
- Shield-ios-xcode.zip → unzip on a Mac → Xcode → Archive
- Bundle ID: au.com.futuret3ch.shield
- Needs Apple Developer Program

## Chrome Web Store
- Shield-chrome-extension.zip (manifest v3, icons 16/48/128)

## Firefox Add-ons
- Shield-firefox-extension.zip (gecko id shield@futuret3ch.com.au)

## Windows / Mac desktop (system tray + local network grid)
Build on the target OS from shield-native:
  npm install
  npm run pack:win    # Windows
  npm run pack:mac    # Mac (then notarize)
The Electron app is a real OS process with tray, interface scan, and panic lock — not a browser tab.
