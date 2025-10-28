#!/bin/bash

# Build and Release script for Easy-Kindle

set -e

VERSION=${1:-"1.0.0"}

echo "🚀 Building Easy-Kindle v${VERSION}"

# Build binary
echo "📦 Building binary..."
bun build index.ts --compile --outfile easy-kindle --target bun

# Get checksum
echo "🔍 Calculating checksum..."
SHA=$(shasum -a 256 easy-kindle | cut -d' ' -f1)

echo ""
echo "✅ Build complete!"
echo ""
echo "Checksum: ${SHA}"
echo ""
echo "To create a release:"
echo "  git tag v${VERSION}"
echo "  git push origin v${VERSION}"

