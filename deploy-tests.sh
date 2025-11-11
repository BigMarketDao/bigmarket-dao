#!/bin/bash -e
set -e


PORT=22
SERVER=euler.brightblock.org
REMOTE_PATH=/var/www/bigmarket-tests/

REMOTE_ROOT=/var/www/bigmarket-tests
DATESTAMP=$(date +"%Y-%m-%d_%H%M")
REMOTE_PATH="$REMOTE_ROOT/unit/$DATESTAMP"

echo "Running coverage..."
npm run test:report
genhtml lcov.info \
  --branch-coverage \
  --ignore-errors inconsistent,corrupt,format \
  --exclude "contracts/extensions/bme004-0-*" \
  --exclude "contracts/external/*" \
  --exclude "contracts/extensions/linear/*" \
  --exclude "contracts/proposals/*" \
  -o coverage

echo "Creating remote directory $REMOTE_PATH..."
ssh -p $PORT bob@$SERVER "mkdir -p '$REMOTE_PATH'"

echo "Uploading coverage report to $SERVER:$REMOTE_PATH..."
rsync -aP -e "ssh -p $PORT" coverage/ "bob@$SERVER:$REMOTE_PATH/"

echo "Coverage report uploaded successfully to $SERVER:$REMOTE_PATH complete."
echo "View at: https://coverage.bigmarket.ai/unit/$DATESTAMP/"
