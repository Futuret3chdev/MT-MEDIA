# irm https://memetorrent.futuret3ch.com.au/cli/install.ps1 | iex
$Origin = if ($env:MT_API) { $env:MT_API.TrimEnd("/") } else { "https://memetorrent.futuret3ch.com.au" }
$dir = Join-Path $HOME "mt-cli"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$ps1 = Join-Path $dir "mt.ps1"
Invoke-RestMethod -Uri "$Origin/cli/mt.ps1" -OutFile $ps1
$cmd = Join-Path $dir "mt.cmd"
@"
@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File `"$ps1`" %*
"@ | Set-Content -Path $cmd -Encoding ASCII
Write-Host "Installed $ps1"
Write-Host "Run:  powershell -File `"$ps1`" quotes"
Write-Host "Or add $dir to PATH, then:  mt quotes"
