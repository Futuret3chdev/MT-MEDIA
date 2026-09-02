# MT CLI for Windows PowerShell
#   irm https://memetorrent.futuret3ch.com.au/cli/mt.ps1 -OutFile mt.ps1
#   powershell -File .\mt.ps1 quotes
param(
  [Parameter(Position = 0)]
  [string]$Command = "help",
  [string]$Range = "24h",
  [string]$Game = "tap",
  [string]$Limit = "10",
  [string]$Key = ""
)

$Origin = if ($env:MT_API) { $env:MT_API.TrimEnd("/") } else { "https://memetorrent.futuret3ch.com.au" }
$Mint = "ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump"
$Pool = "E3kdauLD47xLHAisLuvGTAnqD5MWWJojJYNMCoEvTHi7"

function Get-Mt([string]$Path) {
  $uri = "$Origin$Path"
  return Invoke-RestMethod -Uri $uri -Headers @{ Accept = "application/json" }
}

switch ($Command.ToLower()) {
  { $_ -in @("help", "-h", "--help") } {
    @"
MT CLI  ($Origin)

  quotes              Latest `$MT quote
  listings            Tracked listings
  chart [-Range 24h|7d]
  holders
  pool
  status
  chain
  scores [-Game tap] [-Limit 10]
  license [-Key MT-FREE-…]

Windows:
  irm $Origin/cli/mt.ps1 -OutFile mt.ps1
  powershell -File .\mt.ps1 quotes
"@
    break
  }
  { $_ -in @("quotes", "quote", "price") } {
    Get-Mt "/api/v1/cryptocurrency/quotes/latest?symbol=MT" | ConvertTo-Json -Depth 12
    break
  }
  "listings" {
    Get-Mt "/api/v1/cryptocurrency/listings/latest" | ConvertTo-Json -Depth 12
    break
  }
  { $_ -in @("chart", "ohlcv") } {
    Get-Mt "/api/v1/token/$Mint/chart?range=$Range" | ConvertTo-Json -Depth 8
    break
  }
  "holders" {
    Get-Mt "/api/v1/token/$Mint/holders" | ConvertTo-Json -Depth 8
    break
  }
  "pool" {
    Get-Mt "/api/v1/pool/$Pool" | ConvertTo-Json -Depth 8
    break
  }
  "status" {
    Get-Mt "/api/v1/status" | ConvertTo-Json -Depth 8
    break
  }
  "chain" {
    Get-Mt "/api/v1/chain/info" | ConvertTo-Json -Depth 8
    break
  }
  { $_ -in @("license", "games-license") } {
    if (-not $Key) { Write-Error "Need -Key MT-FREE-…"; exit 1 }
    Get-Mt "/api/v1/games/license?key=$([uri]::EscapeDataString($Key))" | ConvertTo-Json -Depth 8
    break
  }
  "scores" {
    Get-Mt "/api/scores?game_id=$Game&limit=$Limit" | ConvertTo-Json -Depth 8
    break
  }
  default {
    Write-Error "Unknown command: $Command  (try: help)"
    exit 1
  }
}
