# Publishing Easy-Kindle to Homebrew

This guide will help you publish Easy-Kindle as a Homebrew package.

## Overview

There are two approaches to distribute your app via Homebrew:

1. **Source-based install** (easier setup, requires Bun)
2. **Binary-based install** (better UX, no Bun needed)

## Prerequisites

- A GitHub repository (make it public or use a private tap)
- Homebrew installed on your Mac
- Bun installed (for building)

## Method 1: Source-Based Install (Simpler)

This method installs your app with all its source code, requiring users to have Bun installed.

### Step 1: Update package.json

Remove the `"private": true` line from `package.json` if you want to publish it publicly.

### Step 2: Create Homebrew Tap Repository

Create a new repository on GitHub named `homebrew-easy-kindle`:

```bash
cd ~/Desktop/Projects
mkdir homebrew-easy-kindle
cd homebrew-easy-kindle
git init
git remote add origin https://github.com/affanmustafa/homebrew-easy-kindle.git
```

### Step 3: Add the Formula

```bash
# Copy the formula
cp ../easy-kindle/Formula/easy-kindle.rb .

# Check the SHA256
wget https://github.com/affanmustafa/easy-kindle/archive/refs/heads/main.zip -O /tmp/easy-kindle.zip
shasum -a 256 /tmp/easy-kindle.zip
```

Update the `sha256` in `easy-kindle.rb` with the actual checksum.

### Step 4: Push and Test

```bash
git add easy-kindle.rb
git commit -m "Add Easy-Kindle formula"
git push -u origin main

# Test the installation
brew tap affanmustafa/easy-kindle
brew install easy-kindle
```

## Method 2: Binary-Based Install (Better UX)

This method compiles your app into standalone binaries that users can install without needing Bun.

### Step 1: Build Standalone Binaries

```bash
# Build for macOS
bun build index.ts --compile --outfile easy-kindle-macos --target macos

# Build for Linux (if you want to support it)
bun build index.ts --compile --outfile easy-kindle-linux --target linux
```

Or use the helper script:

```bash
./scripts/build-and-release.sh 1.0.0
```

### Step 2: Create GitHub Release

```bash
# Tag the release
git tag v1.0.0
git push origin v1.0.0
```

This will trigger the GitHub Actions workflow to build and upload binaries.

### Step 3: Update Formula with Checksums

After the release is created, get the checksums:

```bash
# Download and check
curl -LO https://github.com/affanmustafa/easy-kindle/releases/download/v1.0.0/easy-kindle-macos
shasum -a 256 easy-kindle-macos
```

Update `Formula/easy-kindle-standalone.rb` with the actual checksums.

### Step 4: Create Tap Repository

Same as Method 1, but use `easy-kindle-standalone.rb` instead.

## Testing Your Formula

### Local Testing

```bash
# Test without publishing
brew install --build-from-source Formula/easy-kindle.rb

# Or for standalone
brew install --build-from-source Formula/easy-kindle-standalone.rb
```

### Install from Your Tap

```bash
brew tap affanmustafa/easy-kindle
brew install easy-kindle
easy-kindle init
```

## Updating Versions

When you release a new version:

1. Update the version in the formula:

   ```ruby
   version "1.1.0"
   ```

2. Update SHA256 (if using source install):

   ```bash
   wget <new-url> -O /tmp/easy-kindle.zip
   shasum -a 256 /tmp/easy-kindle.zip
   ```

3. Update the formula in your tap repo:
   ```bash
   cd ~/Desktop/Projects/homebrew-easy-kindle
   # Edit easy-kindle.rb
   git add easy-kindle.rb
   git commit -m "Update to v1.1.0"
   git push
   ```

## Publishing to Homebrew Core (Optional)

To publish to the main Homebrew repository (requires 50+ GitHub stars and open source):

1. Fork [homebrew-core](https://github.com/Homebrew/homebrew-core)
2. Create your formula in `Formula/e/easy-kindle.rb`
3. Submit a pull request

Note: This requires your project to have 50+ stars and be open source.

## Troubleshooting

### Formula not found

- Make sure the tap repository exists
- Check the repository name: `homebrew-easy-kindle`

### SHA256 mismatch

- Recalculate the checksum and update the formula

### Build failures

- Ensure Bun is installed: `brew install bun`
- Check that all dependencies are properly declared

## Quick Reference

```bash
# Create tap repo locally
mkdir homebrew-easy-kindle && cd homebrew-easy-kindle
git init
cp ../easy-kindle/Formula/easy-kindle.rb .

# Test
brew install --build-from-source easy-kindle.rb

# Publish
git add .
git commit -m "Add easy-kindle"
git push
```
