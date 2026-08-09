#!/usr/bin/env bash
# Sportsphere — Release helper
# -----------------------------------------------------------------------------
# Usage:
#   ./scripts/release.sh patch       # 1.0.0 → 1.0.1
#   ./scripts/release.sh minor       # 1.0.0 → 1.1.0
#   ./scripts/release.sh major       # 1.0.0 → 2.0.0
#   ./scripts/release.sh build       # bump only build number (no version change)
#   ./scripts/release.sh ota "msg"   # push JS-only OTA update to production channel
#
# Prerequisites:
#   - cd into mobile/
#   - eas-cli installed and logged in: `npm i -g eas-cli && eas login`
#   - eas.json + app.json placeholders filled in (see store/SUBMISSION_GUIDE.md §0.5)
#
set -euo pipefail

# --- Guards ------------------------------------------------------------------
if [[ ! -f app.json ]]; then
  echo "ERROR: run this from the mobile/ directory (app.json not found here)."
  exit 1
fi

if ! command -v eas >/dev/null 2>&1; then
  echo "ERROR: eas-cli not installed. Run: npm i -g eas-cli"
  exit 1
fi

if ! eas whoami >/dev/null 2>&1; then
  echo "ERROR: not logged in to EAS. Run: eas login"
  exit 1
fi

MODE="${1:-}"
MSG="${2:-}"

# --- Helpers -----------------------------------------------------------------
read_version() {
  node -e "console.log(require('./app.json').expo.version)"
}

read_ios_build() {
  node -e "console.log(require('./app.json').expo.ios.buildNumber || '1')"
}

read_android_code() {
  node -e "console.log(require('./app.json').expo.android.versionCode || 1)"
}

bump_version() {
  local current="$1"
  local kind="$2"
  IFS='.' read -r major minor patch <<< "$current"
  case "$kind" in
    patch) patch=$((patch + 1)) ;;
    minor) minor=$((minor + 1)); patch=0 ;;
    major) major=$((major + 1)); minor=0; patch=0 ;;
    *) echo "ERROR: unknown bump kind '$kind'"; exit 1 ;;
  esac
  echo "${major}.${minor}.${patch}"
}

write_versions() {
  local new_version="$1"
  local new_ios_build="$2"
  local new_android_code="$3"
  node -e "
    const fs = require('fs');
    const p = './app.json';
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    j.expo.version = '$new_version';
    j.expo.ios.buildNumber = String($new_ios_build);
    j.expo.android.versionCode = Number($new_android_code);
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
    console.log('Updated app.json: version=$new_version ios.buildNumber=$new_ios_build android.versionCode=$new_android_code');
  "
}

# --- Modes -------------------------------------------------------------------
case "$MODE" in
  patch|minor|major)
    current_version="$(read_version)"
    new_version="$(bump_version "$current_version" "$MODE")"
    new_ios_build=$(( $(read_ios_build) + 1 ))
    new_android_code=$(( $(read_android_code) + 1 ))
    echo "→ Bumping version: $current_version → $new_version ($MODE)"
    write_versions "$new_version" "$new_ios_build" "$new_android_code"
    echo "→ Committing + tagging"
    git add app.json
    git commit -m "Release v$new_version"
    git tag "v$new_version"
    read -r -p "Push to origin/main? (y/N) " push_answer
    if [[ "$push_answer" =~ ^[Yy]$ ]]; then
      git push origin main --tags
    else
      echo "Skipping push. Push manually with: git push origin main --tags"
    fi
    echo "→ Building iOS .ipa (production profile, ~25 min)"
    eas build --profile production --platform ios --non-interactive
    echo "→ Building Android .aab (production profile, ~15 min)"
    eas build --profile production --platform android --non-interactive
    echo
    echo "✅ Build complete. Next:"
    echo "   eas submit --platform ios --profile production"
    echo "   eas submit --platform android --profile production"
    echo "   Then complete the store listings per store/SUBMISSION_GUIDE.md"
    ;;

  build)
    new_ios_build=$(( $(read_ios_build) + 1 ))
    new_android_code=$(( $(read_android_code) + 1 ))
    echo "→ Bumping build number only (no version change)"
    write_versions "$(read_version)" "$new_ios_build" "$new_android_code"
    git add app.json
    git commit -m "Bump build number to ios=$new_ios_build android=$new_android_code"
    echo "✅ Committed. Push with: git push origin main"
    ;;

  ota)
    if [[ -z "$MSG" ]]; then
      echo "ERROR: OTA mode requires a message. Usage: ./scripts/release.sh ota \"Fix feed rendering\""
      exit 1
    fi
    echo "→ Verifying this is a JS-only change (no native module / app.json plugin changes)..."
    if ! git diff --quiet HEAD -- app.json; then
      echo "WARNING: app.json has uncommitted changes. Native config changes cannot be shipped via OTA."
      read -r -p "Continue anyway? (y/N) " ota_answer
      [[ "$ota_answer" =~ ^[Yy]$ ]] || exit 1
    fi
    echo "→ Pushing OTA update to production channel: \"$MSG\""
    eas update --branch production --message "$MSG" --non-interactive
    echo "✅ OTA update published. Live in 5-15 minutes."
    ;;

  *)
    echo "Sportsphere release helper"
    echo
    echo "Usage:"
    echo "  $0 patch            Bump 1.0.0 → 1.0.1, build, tag, push"
    echo "  $0 minor            Bump 1.0.0 → 1.1.0, build, tag, push"
    echo "  $0 major            Bump 1.0.0 → 2.0.0, build, tag, push"
    echo "  $0 build            Bump only build number (no version change)"
    echo "  $0 ota \"msg\"        Push JS-only OTA update to production channel"
    exit 1
    ;;
esac
