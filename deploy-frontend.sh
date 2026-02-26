#!/bin/bash
# ============================================
# Deploy frontend to AWS S3 + CloudFront
# ============================================
# Usage: ./deploy-frontend.sh <S3_BUCKET_NAME> [CLOUDFRONT_DISTRIBUTION_ID]
# Example: ./deploy-frontend.sh hostel-frontend-bucket E1A2B3C4D5E6F7

set -e

S3_BUCKET="$1"
CF_DIST_ID="$2"

if [ -z "$S3_BUCKET" ]; then
  echo "❌ Usage: $0 <S3_BUCKET_NAME> [CLOUDFRONT_DISTRIBUTION_ID]"
  exit 1
fi

echo "📦 Building frontend for production..."
npm run build

echo "🚀 Uploading to S3 bucket: $S3_BUCKET"
aws s3 sync dist/ "s3://$S3_BUCKET" --delete

# Set cache headers for assets (long cache)
aws s3 cp "s3://$S3_BUCKET/assets/" "s3://$S3_BUCKET/assets/" \
  --recursive --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000, immutable" \
  --content-type "" --exclude "*" --include "*.js" --include "*.css"

# Set short cache for index.html (always fresh)
aws s3 cp dist/index.html "s3://$S3_BUCKET/index.html" \
  --cache-control "no-cache, no-store, must-revalidate"

echo "✅ S3 upload complete!"

if [ -n "$CF_DIST_ID" ]; then
  echo "🔄 Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id "$CF_DIST_ID" \
    --paths "/*"
  echo "✅ CloudFront invalidation submitted!"
fi

echo "🎉 Deployment complete!"
