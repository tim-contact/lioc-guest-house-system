#!/usr/bin/env bash
set -euo pipefail

IMO_NUMBER="${1:-7406784}"
OFAC_URL="https://sanctionssearch.ofac.treas.gov/"

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

# Get the session cookie and ASP.NET ViewState.
curl -fsS --compressed \
  --cookie-jar "$TEMP_DIR/cookies" \
  "$OFAC_URL" \
  --output "$TEMP_DIR/page.html"

VIEWSTATE=$(perl -ne '
/name="__VIEWSTATE"[^>]*value="([^"]*)"/ && print $1
' "$TEMP_DIR/page.html")

VIEWSTATE_GENERATOR=$(perl -ne '
/name="__VIEWSTATEGENERATOR"[^>]*value="([^"]*)"/ && print $1
' "$TEMP_DIR/page.html")

# Submit IMO and print only the machine-readable lookup result.
curl -fsS --compressed \
  --cookie "$TEMP_DIR/cookies" \
  --referer "$OFAC_URL" \
  --data-urlencode "__VIEWSTATE=$VIEWSTATE" \
  --data-urlencode "__VIEWSTATEGENERATOR=$VIEWSTATE_GENERATOR" \
  --data-urlencode 'ctl00$MainContent$ddlType=Vessel' \
  --data-urlencode "ctl00\$MainContent\$txtID=$IMO_NUMBER" \
  --data-urlencode 'ctl00$MainContent$Slider1=100' \
  --data-urlencode 'ctl00$MainContent$Slider1_Boundcontrol=100' \
  --data-urlencode 'ctl00$MainContent$btnSearch=Search' \
  "$OFAC_URL" |
  perl -0777 -ne '
if (/id="ctl00_MainContent_lblResults"[^>]*>\s*([^<]+)/) {
  $result = $1;
  $result =~ s/^\s+|\s+$//g;
  print $result =~ /0 Found/ ? "NOT_LISTED\n" : "POSSIBLE_MATCH\n";
} else {
  die "Could not read OFAC lookup result\n";
}
'
