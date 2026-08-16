#!/usr/bin/env python3
"""Pack MT Studio.app that only opens the web studio URL."""
import tempfile
import zipfile
from pathlib import Path

OUT = Path("/opt/mt-media/memetorrent-react/public/downloads")
URL = "https://memetorrent.futuret3ch.com.au/studio"

LAUNCHER = f"""#!/bin/bash
open "{URL}"
"""

PLIST = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key><string>en</string>
  <key>CFBundleDisplayName</key><string>MT Studio</string>
  <key>CFBundleExecutable</key><string>mtstudio</string>
  <key>CFBundleIdentifier</key><string>au.com.futuret3ch.mtstudio</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleName</key><string>MT Studio</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.0.1</string>
  <key>CFBundleVersion</key><string>2</string>
  <key>LSMinimumSystemVersion</key><string>12.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
"""

COMMAND = f"""#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
APP="$DIR/MT Studio.app"
BIN="$APP/Contents/MacOS/mtstudio"
chmod +x "$BIN" "$DIR/Open MT Studio.command" 2>/dev/null
xattr -dr com.apple.quarantine "$DIR" 2>/dev/null
# Prefer opening the site directly — the .app is a convenience.
open "{URL}"
"""

HOWTO = f"""MT Studio on Mac
================
The web studio is the real app:

  {URL}

If the .app fails (error -10661), double-click
"Open MT Studio.command" — it opens Safari/Chrome to that URL.

Or paste the URL in your browser. Sign in with the site account icon.
"""


def write_zip(zip_path: Path) -> None:
    stage = Path(tempfile.mkdtemp())
    app = stage / "MT Studio.app"
    macos = app / "Contents" / "MacOS"
    macos.mkdir(parents=True)
    (app / "Contents" / "Resources").mkdir()
    (app / "Contents" / "Info.plist").write_text(PLIST)
    (app / "Contents" / "PkgInfo").write_bytes(b"APPL????")
    exe = macos / "mtstudio"
    exe.write_text(LAUNCHER)
    exe.chmod(0o755)
    helper = stage / "Open MT Studio.command"
    helper.write_text(COMMAND)
    helper.chmod(0o755)
    (stage / "HOW-TO-OPEN.txt").write_text(HOWTO)
    (stage / "Open Studio in Browser.txt").write_text(URL + "\n")

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in stage.rglob("*"):
            if not p.is_file():
                continue
            rel = str(p.relative_to(stage))
            mode = 0o100755 if p.name in {"mtstudio", "Open MT Studio.command"} else 0o100644
            info = zipfile.ZipInfo(rel)
            info.external_attr = mode << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            zf.writestr(info, p.read_bytes())
    print(zip_path, zip_path.stat().st_size)


if __name__ == "__main__":
    write_zip(OUT / "MTStudio-macos.zip")
    write_zip(OUT / "MTStudio-macos-intel.zip")
