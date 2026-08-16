# Local Flutter Web against production API (bypasses CORS in Chrome — DEV ONLY)
$chromeData = "$env:TEMP\flutter_chrome_cors_off"
New-Item -ItemType Directory -Force -Path $chromeData | Out-Null
flutter run -d chrome `
  --web-browser-flag "--disable-web-security" `
  --web-browser-flag "--user-data-dir=$chromeData"
