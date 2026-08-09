#!/usr/bin/env bash
# Sportsphere — Credentials sanity check
# -----------------------------------------------------------------------------
# Scans mobile/app.json + mobile/eas.json + mobile/store/credentials/ for
# placeholder values that need to be replaced before running `eas submit`.
#
# Run from anywhere; expects mobile/ to live at ./mobile relative to repo root.
#
set -euo pipefail

# Color codes for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Resolve repo root (parent of mobile/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CRED_DIR="$MOBILE_DIR/store/credentials"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE} Sportsphere — Credentials Sanity Check${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

# Track failures
FAIL=0

# ----------------------------------------------------------------------------
# 1. EAS project ID — must be a real UUID v4, not "your-project-id"
# ----------------------------------------------------------------------------
EAS_ID="$(node -e "console.log(require('$MOBILE_DIR/app.json').expo.extra.eas.projectId)")"
if [[ "$EAS_ID" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
  echo -e "${GREEN}✓ EAS project ID${NC}: $EAS_ID (valid UUID v4 format)"
  echo -e "  ${YELLOW}⚠ Verify this matches your real project at expo.dev — run 'eas init' to confirm${NC}"
else
  echo -e "${RED}✗ EAS project ID${NC}: '$EAS_ID' is not a valid UUID v4"
  echo -e "  Run: cd mobile && eas init"
  FAIL=1
fi

# Updates URL must match EAS project ID
UPDATES_URL="$(node -e "console.log(require('$MOBILE_DIR/app.json').expo.updates.url)")"
EXPECTED_URL="https://u.expo.dev/$EAS_ID"
if [[ "$UPDATES_URL" == "$EXPECTED_URL" ]]; then
  echo -e "${GREEN}✓ Updates URL${NC}: matches EAS project ID"
else
  echo -e "${RED}✗ Updates URL${NC}: '$UPDATES_URL' should be '$EXPECTED_URL'"
  FAIL=1
fi

EAS_UPDATES_URL="$(node -e "console.log(require('$MOBILE_DIR/eas.json').update.url)")"
if [[ "$EAS_UPDATES_URL" == "$EXPECTED_URL" ]]; then
  echo -e "${GREEN}✓ eas.json update.url${NC}: matches EAS project ID"
else
  echo -e "${RED}✗ eas.json update.url${NC}: '$EAS_UPDATES_URL' should be '$EXPECTED_URL'"
  FAIL=1
fi

echo

# ----------------------------------------------------------------------------
# 2. Apple credentials — format check + warning that user must verify
# ----------------------------------------------------------------------------
echo -e "${BLUE}Apple Credentials (verify with your Apple Developer account)${NC}"
echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"

APPLE_ID="$(node -e "console.log(require('$MOBILE_DIR/eas.json').submit.production.ios.appleId)")"
if [[ "$APPLE_ID" == "your-apple-id@email.com" ]] || [[ -z "$APPLE_ID" ]]; then
  echo -e "${RED}✗ Apple ID${NC}: still placeholder '$APPLE_ID'"
  FAIL=1
elif [[ "$APPLE_ID" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
  echo -e "${GREEN}✓ Apple ID${NC}: $APPLE_ID (valid email format)"
  echo -e "  ${YELLOW}⚠ Verify this is the Apple ID enrolled in Apple Developer Program${NC}"
else
  echo -e "${RED}✗ Apple ID${NC}: '$APPLE_ID' is not a valid email"
  FAIL=1
fi

ASC_APP_ID="$(node -e "console.log(require('$MOBILE_DIR/eas.json').submit.production.ios.ascAppId)")"
if [[ "$ASC_APP_ID" =~ ^[0-9]{8,15}$ ]]; then
  echo -e "${GREEN}✓ ASC App ID${NC}: $ASC_APP_ID (numeric, valid format)"
  echo -e "  ${YELLOW}⚠ Verify at appstoreconnect.apple.com → My Apps → App Information${NC}"
else
  echo -e "${RED}✗ ASC App ID${NC}: '$ASC_APP_ID' should be 8-15 digits (numeric only)"
  echo -e "  Find it at: appstoreconnect.apple.com → My Apps → App Information → General"
  FAIL=1
fi

APPLE_TEAM_ID="$(node -e "console.log(require('$MOBILE_DIR/eas.json').submit.production.ios.appleTeamId)")"
if [[ "$APPLE_TEAM_ID" =~ ^[A-Z0-9]{10}$ ]]; then
  echo -e "${GREEN}✓ Apple Team ID${NC}: $APPLE_TEAM_ID (10-char alphanumeric)"
  echo -e "  ${YELLOW}⚠ Verify at developer.apple.com → Account → Membership Details${NC}"
else
  echo -e "${RED}✗ Apple Team ID${NC}: '$APPLE_TEAM_ID' should be exactly 10 alphanumeric chars"
  FAIL=1
fi

ASC_KEY_ID="$(node -e "console.log(require('$MOBILE_DIR/eas.json').submit.production.ios.ascApiKeyId)")"
if [[ "$ASC_KEY_ID" =~ ^[A-Z0-9]{10}$ ]]; then
  echo -e "${GREEN}✓ ASC API Key ID${NC}: $ASC_KEY_ID (10-char alphanumeric)"
  echo -e "  ${YELLOW}⚠ Verify at appstoreconnect.apple.com → Users and Access → Integrations → App Store Connect API${NC}"
else
  echo -e "${RED}✗ ASC API Key ID${NC}: '$ASC_KEY_ID' should be 10 alphanumeric chars"
  FAIL=1
fi

ASC_ISSUER_ID="$(node -e "console.log(require('$MOBILE_DIR/eas.json').submit.production.ios.ascApiKeyIssuerId)")"
if [[ "$ASC_ISSUER_ID" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
  echo -e "${GREEN}✓ ASC Issuer ID${NC}: $ASC_ISSUER_ID (valid UUID)"
  echo -e "  ${YELLOW}⚠ Verify at appstoreconnect.apple.com → Users and Access → Integrations → App Store Connect API${NC}"
else
  echo -e "${RED}✗ ASC Issuer ID${NC}: '$ASC_ISSUER_ID' is not a valid UUID"
  FAIL=1
fi

ASC_KEY_PATH="$(node -e "console.log(require('$MOBILE_DIR/eas.json').submit.production.ios.ascApiKeyPath)")"
EXPECTED_KEY_PATH="./store/credentials/AuthKey_$ASC_KEY_ID.p8"
if [[ "$ASC_KEY_PATH" == "$EXPECTED_KEY_PATH" ]]; then
  echo -e "${GREEN}✓ ASC API Key path${NC}: matches Key ID"
else
  echo -e "${RED}✗ ASC API Key path${NC}: '$ASC_KEY_PATH' should be '$EXPECTED_KEY_PATH'"
  FAIL=1
fi

if [[ -f "$CRED_DIR/AuthKey_$ASC_KEY_ID.p8" ]]; then
  echo -e "${GREEN}✓ AuthKey .p8 file${NC}: present at store/credentials/AuthKey_$ASC_KEY_ID.p8"
else
  echo -e "${RED}✗ AuthKey .p8 file${NC}: NOT FOUND at store/credentials/AuthKey_$ASC_KEY_ID.p8"
  echo -e "  Download from appstoreconnect.apple.com → Users and Access → Integrations → App Store Connect API → Download API Key"
  FAIL=1
fi

echo

# ----------------------------------------------------------------------------
# 3. Google credentials
# ----------------------------------------------------------------------------
echo -e "${BLUE}Google Play Credentials (verify with your Play Console)${NC}"
echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"

SA_KEY_PATH="$(node -e "console.log(require('$MOBILE_DIR/eas.json').submit.production.android.serviceAccountKeyPath)")"
EXPECTED_SA_PATH="./store/credentials/google-service-account-key.json"
if [[ "$SA_KEY_PATH" == "$EXPECTED_SA_PATH" ]]; then
  echo -e "${GREEN}✓ Service account key path${NC}: $SA_KEY_PATH"
else
  echo -e "${RED}✗ Service account key path${NC}: '$SA_KEY_PATH' should be '$EXPECTED_SA_PATH'"
  FAIL=1
fi

if [[ -f "$CRED_DIR/google-service-account-key.json" ]]; then
  echo -e "${GREEN}✓ google-service-account-key.json${NC}: present"
  # Validate JSON structure
  if node -e "const k = require('$CRED_DIR/google-service-account-key.json'); if (!k.private_key || !k.client_email) process.exit(1)" 2>/dev/null; then
    echo -e "${GREEN}✓ Service account JSON${NC}: has private_key + client_email"
  else
    echo -e "${RED}✗ Service account JSON${NC}: missing private_key or client_email"
    FAIL=1
  fi
else
  echo -e "${RED}✗ google-service-account-key.json${NC}: NOT FOUND"
  echo -e "  Create at: play.google.com/console → Setup → API access → Create service account → Download JSON"
  echo -e "  Place at: mobile/store/credentials/google-service-account-key.json"
  FAIL=1
fi

echo

# ----------------------------------------------------------------------------
# 4. Production env URL — should be HTTPS for App Store
# ----------------------------------------------------------------------------
echo -e "${BLUE}Production Environment URL${NC}"
echo -e "${BLUE}──────────────────────────────────────────────────────────────${NC}"

PROD_URL="$(node -e "console.log(require('$MOBILE_DIR/eas.json').build.production.env.EXPO_PUBLIC_API_URL)")"
if [[ "$PROD_URL" =~ ^https:// ]]; then
  echo -e "${GREEN}✓ Production EXPO_PUBLIC_API_URL${NC}: $PROD_URL (HTTPS)"
elif [[ "$PROD_URL" =~ ^http:// ]]; then
  echo -e "${YELLOW}⚠ Production EXPO_PUBLIC_API_URL${NC}: $PROD_URL (HTTP — will trigger App Store rejection)"
  echo -e "  Run scripts/setup-https.sh on the VPS, then update eas.json production env to HTTPS"
else
  echo -e "${RED}✗ Production EXPO_PUBLIC_API_URL${NC}: '$PROD_URL' is not a URL"
  FAIL=1
fi

echo

# ----------------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------------
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [[ "$FAIL" -eq 0 ]]; then
  echo -e "${GREEN}✓ All format checks passed.${NC}"
  echo
  echo -e "${YELLOW}Next steps:${NC}"
  echo -e "  1. Run 'cd mobile && eas whoami' to confirm EAS login"
  echo -e "  2. Run 'cd mobile && eas init' to confirm the EAS project ID matches"
  echo -e "  3. Run './scripts/release.sh patch' to build + submit production binaries"
  echo -e "  4. Complete the store listings per store/SUBMISSION_GUIDE.md"
else
  echo -e "${RED}✗ Some checks failed. Fix the issues above before submitting.${NC}"
  echo
  echo -e "${YELLOW}Need help?${NC} See store/SUBMISSION_GUIDE.md §0.5 (Replace all placeholders)"
fi
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

exit $FAIL
