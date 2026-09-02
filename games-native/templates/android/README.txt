MT Maker → Android Studio

This zip is an Android Studio project. Maker wrote the game.
You still compile the APK in Android Studio — same as any other Android app.

1. Unzip this folder.
2. Open Android Studio.
3. File → Open → select this folder (the one with settings.gradle).
4. Trust the project. Let Gradle sync (first time downloads the Android SDK / Gradle 8.2 if needed).
5. Plug in a phone or start an emulator → green Run.
6. Play Store: Build → Generate Signed Bundle / APK.

The game is app/src/main/assets/index.html.
applicationId is au.com.futuret3ch.made in app/build.gradle — change it before you list on Play.

JDK 17 is required (Android Studio ships it).
