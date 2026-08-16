#!/usr/bin/env python3
import shutil
import tempfile
import zipfile
from pathlib import Path

PLIST = """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>MT Studio</string>
  <key>CFBundleDisplayName</key><string>MT Studio</string>
  <key>CFBundleIdentifier</key><string>au.com.futuret3ch.mtstudio</string>
  <key>CFBundleExecutable</key><string>mtstudio</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>LSMinimumSystemVersion</key><string>12.0</string>
</dict></plist>
"""

HELPER = """#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
APP="$DIR/MT Studio.app"
xattr -dr com.apple.quarantine "$APP" "$DIR" 2>/dev/null || true
open "$APP"
"""

HOWTO = """If macOS says the developer cannot be verified:
Right-click MT Studio, Open.
Or run Open MT Studio.command
Or: xattr -dr com.apple.quarantine "MT Studio.app" && open "MT Studio.app"
"""


def pack(bin_path: str, zip_path: str) -> None:
    stage = Path(tempfile.mkdtemp())
    app = stage / "MT Studio.app"
    (app / "Contents" / "MacOS").mkdir(parents=True)
    (app / "Contents" / "Resources").mkdir(parents=True)
    (app / "Contents" / "Info.plist").write_text(PLIST)
    dest = app / "Contents" / "MacOS" / "mtstudio"
    shutil.copy(bin_path, dest)
    dest.chmod(0o755)
    (app / "Contents" / "PkgInfo").write_bytes(b"APPL????")
    helper = stage / "Open MT Studio.command"
    helper.write_text(HELPER)
    helper.chmod(0o755)
    (stage / "HOW-TO-OPEN.txt").write_text(HOWTO)
    zpath = Path(zip_path)
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for p in stage.rglob("*"):
            if not p.is_file():
                continue
            mode = 0o100755 if p.suffix == ".command" or p.name == "mtstudio" else 0o100644
            zi = zipfile.ZipInfo.from_file(p, str(p.relative_to(stage)))
            zi.external_attr = mode << 16
            z.writestr(zi, p.read_bytes())
    shutil.rmtree(stage)
    print(zpath, zpath.stat().st_size)


if __name__ == "__main__":
    pack("/tmp/mtstudio-arm64", "/opt/mt-media/memetorrent-react/public/downloads/MTStudio-macos.zip")
    pack("/tmp/mtstudio-amd64", "/opt/mt-media/memetorrent-react/public/downloads/MTStudio-macos-intel.zip")
